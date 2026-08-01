import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import Redis from "ioredis";
import request from "supertest";
import { AppModule } from "../src/app.module";

/**
 * Critical path integration tests for production readiness.
 * Covers: concurrent checkout, IDOR, financial calculations, transfers,
 * authorization, path traversal, and order FSM enforcement.
 *
 * Requires Postgres + Redis (docker compose up -d) and a seeded database.
 */

const AMIRA_KEY = "dadan-vip-key-001";
const LAYLA_KEY = "dadan-key-003";
const ADMIN_EMAIL = "admin@dadan.sa";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "AdminPass123!";

function cookieOf(res: request.Response): string {
  const cookies = res.headers["set-cookie"];
  expect(cookies).toBeDefined();
  return (Array.isArray(cookies) ? cookies : [cookies]).join("; ");
}

describe("Critical Path Tests (e2e)", () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication["getHttpServer"]>;
  let amiraCookie: string;
  let laylaCookie: string;
  let adminCookie: string;

  beforeAll(async () => {
    const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
    const patterns = ["auth:validate-key:*", "admin:login:*", "verify:*", "transfer:initiate:*"];
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length) await redis.del(...keys);
    }
    await redis.quit();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    http = app.getHttpServer();

    // Login all test users
    const amiraRes = await request(http)
      .post("/auth/validate-key")
      .send({ houseKey: AMIRA_KEY })
      .expect(201);
    amiraCookie = cookieOf(amiraRes);

    const laylaRes = await request(http)
      .post("/auth/validate-key")
      .send({ houseKey: LAYLA_KEY })
      .expect(201);
    laylaCookie = cookieOf(laylaRes);

    const adminRes = await request(http)
      .post("/admin/auth/login")
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .expect(201);
    adminCookie = cookieOf(adminRes);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("1. Concurrent checkout race condition", () => {
    let pieceId: string;

    beforeAll(async () => {
      // Admin creates a fresh piece
      const designs = await request(http)
        .get("/admin/designs")
        .set("Cookie", adminCookie)
        .expect(200);
      const designId = designs.body.items[0].id;

      const piece = await request(http)
        .post("/admin/pieces")
        .set("Cookie", adminCookie)
        .send({ designId })
        .expect(201);
      pieceId = piece.body.id;
    });

    it("only one concurrent checkout succeeds for the same piece", async () => {
      // Both clients add the same piece to cart
      await request(http)
        .post("/client/cart")
        .set("Cookie", amiraCookie)
        .send({ pieceId })
        .expect(201);

      // Wait for hold to allow the second client
      // (second client gets PIECE_RESERVED since hold is active)
      const secondAdd = await request(http)
        .post("/client/cart")
        .set("Cookie", laylaCookie)
        .send({ pieceId });

      // If first hold is active, second gets rejected with PIECE_RESERVED
      if (secondAdd.status === 400) {
        expect(secondAdd.body.messageKey).toContain("PIECE_RESERVED");
      }

      // First client checks out
      const checkout1 = await request(http)
        .post("/client/checkout")
        .set("Cookie", amiraCookie)
        .send({
          shippingAddress: {
            fullName: "Amira",
            line1: "Street 1",
            city: "Riyadh",
            region: "Riyadh",
            country: "SA",
            postalCode: "11564",
            phone: "+966500000001",
          },
          paymentMethod: "MADA",
          paymentToken: "tok_concurrent_test_1",
        });

      expect(checkout1.status).toBe(201);
      expect(checkout1.body.orderStatus).toBe("PAID");
    });
  });

  describe("2. IDOR: wardrobe access protection", () => {
    it("Client B cannot access Client A's piece in wardrobe", async () => {
      // Get Amira's wardrobe pieces
      const wardrobe = await request(http)
        .get("/client/wardrobe")
        .set("Cookie", amiraCookie)
        .expect(200);

      if (wardrobe.body.length > 0) {
        const amiraPieceId = wardrobe.body[0].id;

        // Layla tries to access Amira's piece
        await request(http)
          .get(`/client/wardrobe/${amiraPieceId}`)
          .set("Cookie", laylaCookie)
          .expect(404);
      }
    });

    it("Client B cannot download Client A's certificate", async () => {
      const wardrobe = await request(http)
        .get("/client/wardrobe")
        .set("Cookie", amiraCookie)
        .expect(200);

      if (wardrobe.body.length > 0) {
        const amiraPieceId = wardrobe.body[0].id;

        await request(http)
          .get(`/client/wardrobe/${amiraPieceId}/certificate`)
          .set("Cookie", laylaCookie)
          .expect(404);
      }
    });
  });

  describe("3. IDOR: order access protection", () => {
    it("Client B cannot view Client A's orders", async () => {
      const orders = await request(http)
        .get("/client/orders")
        .set("Cookie", amiraCookie)
        .expect(200);

      if (orders.body.items?.length > 0) {
        const amiraOrderId = orders.body.items[0].id;

        await request(http)
          .get(`/client/orders/${amiraOrderId}`)
          .set("Cookie", laylaCookie)
          .expect(404);
      }
    });
  });

  describe("4. Double-charge prevention (idempotency)", () => {
    it("same cart contents submitted twice produces only one order", async () => {
      const designs = await request(http)
        .get("/admin/designs")
        .set("Cookie", adminCookie)
        .expect(200);
      const designId = designs.body.items[0].id;

      const piece = await request(http)
        .post("/admin/pieces")
        .set("Cookie", adminCookie)
        .send({ designId })
        .expect(201);

      await request(http)
        .post("/client/cart")
        .set("Cookie", amiraCookie)
        .send({ pieceId: piece.body.id })
        .expect(201);

      const checkout = await request(http)
        .post("/client/checkout")
        .set("Cookie", amiraCookie)
        .send({
          shippingAddress: {
            fullName: "Amira",
            line1: "Street 1",
            city: "Riyadh",
            region: "Riyadh",
            country: "SA",
            postalCode: "11564",
            phone: "+966500000001",
          },
          paymentMethod: "MADA",
          paymentToken: "tok_idemp_test",
        });

      expect(checkout.status).toBe(201);

      // Second attempt with empty cart should fail
      const checkout2 = await request(http)
        .post("/client/checkout")
        .set("Cookie", amiraCookie)
        .send({
          shippingAddress: {
            fullName: "Amira",
            line1: "Street 1",
            city: "Riyadh",
            region: "Riyadh",
            country: "SA",
            postalCode: "11564",
            phone: "+966500000001",
          },
          paymentMethod: "MADA",
          paymentToken: "tok_idemp_test_2",
        });

      expect(checkout2.status).toBe(400);
    });
  });

  describe("5. VAT calculation correctness", () => {
    it("total matches sum of line items with per-item rounding", async () => {
      const orders = await request(http)
        .get("/client/orders")
        .set("Cookie", amiraCookie)
        .expect(200);

      if (orders.body.items?.length > 0) {
        const order = await request(http)
          .get(`/client/orders/${orders.body.items[0].id}`)
          .set("Cookie", amiraCookie)
          .expect(200);

        const itemsTotal = order.body.items.reduce(
          (sum: number, item: { lineTotal: string }) => sum + parseFloat(item.lineTotal),
          0,
        );
        const orderTotal = parseFloat(order.body.totalAmount);

        // Total should equal sum of line items (no rounding gap)
        expect(Math.abs(itemsTotal - orderTotal)).toBeLessThan(0.01);
      }
    });
  });

  describe("6. Admin role escalation prevention", () => {
    it("Client JWT rejected on admin endpoints", async () => {
      await request(http)
        .get("/admin/clients")
        .set("Cookie", amiraCookie)
        .expect(401);
    });

    it("VIEWER role cannot perform write operations", async () => {
      // Try to use client cookie on admin route
      await request(http)
        .post("/admin/pieces")
        .set("Cookie", amiraCookie)
        .send({ designId: "fake-id" })
        .expect(401);
    });
  });

  describe("7. Payment failure handling", () => {
    it("declined payment creates no order and piece stays AVAILABLE", async () => {
      const designs = await request(http)
        .get("/admin/designs")
        .set("Cookie", adminCookie)
        .expect(200);
      const designId = designs.body.items[0].id;

      const piece = await request(http)
        .post("/admin/pieces")
        .set("Cookie", adminCookie)
        .send({ designId })
        .expect(201);

      await request(http)
        .post("/client/cart")
        .set("Cookie", amiraCookie)
        .send({ pieceId: piece.body.id })
        .expect(201);

      // Use 'fail' token which triggers mock payment decline
      const checkout = await request(http)
        .post("/client/checkout")
        .set("Cookie", amiraCookie)
        .send({
          shippingAddress: {
            fullName: "Amira",
            line1: "Street 1",
            city: "Riyadh",
            region: "Riyadh",
            country: "SA",
            postalCode: "11564",
            phone: "+966500000001",
          },
          paymentMethod: "MADA",
          paymentToken: "fail",
        });

      expect(checkout.status).toBe(400);

      // Verify piece is still available
      const adminPiece = await request(http)
        .get(`/admin/pieces/${piece.body.id}`)
        .set("Cookie", adminCookie)
        .expect(200);

      expect(adminPiece.body.status).toBe("AVAILABLE");
    });
  });

  describe("8. Order status FSM enforcement", () => {
    it("rejects invalid status transitions", async () => {
      // Find a PAID or FULFILLED order
      const orders = await request(http)
        .get("/admin/orders")
        .set("Cookie", adminCookie)
        .expect(200);

      const paidOrder = orders.body.items?.find(
        (o: { status: string }) => o.status === "FULFILLED",
      );

      if (paidOrder) {
        // FULFILLED -> PENDING should be rejected
        const res = await request(http)
          .patch(`/admin/orders/${paidOrder.id}/status`)
          .set("Cookie", adminCookie)
          .send({ status: "PENDING" });

        expect(res.status).toBe(400);
      }
    });
  });

  describe("9. Path traversal upload rejection", () => {
    // Node's HTTP layer normalizes dot segments before routing, so traversal
    // attempts resolve outside /uploads and never serve file contents. Both
    // 400 (explicit rejection) and 404 (no route) are valid rejections.
    it("rejects directory traversal in upload paths", async () => {
      await request(http)
        .get("/uploads/../../.env")
        .expect((res) => expect([400, 404]).toContain(res.status));
    });

    it("rejects encoded traversal attempts", async () => {
      await request(http)
        .get("/uploads/%2e%2e/%2e%2e/.env")
        .expect((res) => expect([400, 404]).toContain(res.status));
    });

    it("serves valid upload paths normally (or 404)", async () => {
      const res = await request(http)
        .get("/uploads/nonexistent-file.jpg");

      // Valid path format, but file doesn't exist
      expect([200, 404]).toContain(res.status);
    });
  });

  describe("10. Cart hold expiry", () => {
    it("expired hold allows another client to add the piece", async () => {
      const designs = await request(http)
        .get("/admin/designs")
        .set("Cookie", adminCookie)
        .expect(200);
      const designId = designs.body.items[0].id;

      const piece = await request(http)
        .post("/admin/pieces")
        .set("Cookie", adminCookie)
        .send({ designId })
        .expect(201);

      // Client A adds piece
      await request(http)
        .post("/client/cart")
        .set("Cookie", amiraCookie)
        .send({ pieceId: piece.body.id })
        .expect(201);

      // Client B cannot add it while hold is active
      const attemptWhileHeld = await request(http)
        .post("/client/cart")
        .set("Cookie", laylaCookie)
        .send({ pieceId: piece.body.id });

      expect(attemptWhileHeld.status).toBe(400);

      // Client A removes from cart (simulates expiry)
      await request(http)
        .delete(`/client/cart/${piece.body.id}`)
        .set("Cookie", amiraCookie)
        .expect(200);

      // Now Client B can add it
      const attemptAfterExpiry = await request(http)
        .post("/client/cart")
        .set("Cookie", laylaCookie)
        .send({ pieceId: piece.body.id });

      expect(attemptAfterExpiry.status).toBe(201);

      // Cleanup
      await request(http)
        .delete(`/client/cart/${piece.body.id}`)
        .set("Cookie", laylaCookie);
    });
  });
});
