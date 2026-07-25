import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import Redis from "ioredis";
import request from "supertest";
import { AppModule } from "../src/app.module";

// Requires Postgres + Redis (docker compose up -d) and a seeded database
// (pnpm --filter @dadan/db db:seed).

const AMIRA_KEY = "dadan-vip-key-001"; // locale: ar
const LAYLA_KEY = "dadan-key-003"; // locale: en
const ADMIN_EMAIL = "admin@dadan.sa";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "AdminPass123!";

// Minimal valid 1x1 JPEG for the upload test.
const TINY_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A0f/Z",
  "base64",
);

function cookieOf(res: request.Response): string {
  const cookies = res.headers["set-cookie"];
  expect(cookies).toBeDefined();
  return (Array.isArray(cookies) ? cookies : [cookies]).join("; ");
}

describe("DADAN API (e2e)", () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication["getHttpServer"]>;

  beforeAll(async () => {
    // Clear leftover per-IP rate-limit counters so repeated local runs
    // (login attempts share 127.0.0.1) don't trip the brute-force limits.
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
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health/live is public", async () => {
    await request(http).get("/health/live").expect(200, { status: "ok" });
  });

  it("denies unauthenticated access to client and admin routes", async () => {
    await request(http).get("/client/collections").expect(401);
    await request(http).get("/admin/clients").expect(401);
  });

  it("rejects an invalid house key with a localized Arabic message", async () => {
    const res = await request(http)
      .post("/auth/validate-key")
      .send({ houseKey: "definitely-wrong-key" })
      .expect(401);
    expect(res.body.messageKey).toBe("errors.UNAUTHORIZED");
    expect(res.body.message).toBe("غير مصرح بالدخول");
  });

  describe("client flow (Arabic client)", () => {
    let cookie: string;

    it("logs in with a house key", async () => {
      const res = await request(http)
        .post("/auth/validate-key")
        .send({ houseKey: AMIRA_KEY })
        .expect(201);
      cookie = cookieOf(res);
      expect(res.body.displayName).toBeTruthy();
      expect(res.body.locale).toBe("ar");
    });

    it("returns the catalog in Arabic (stored client locale)", async () => {
      const res = await request(http)
        .get("/client/collections")
        .set("Cookie", cookie)
        .expect(200);
      const noir = res.body.find((c: { slug: string }) => c.slug === "noir-collection");
      expect(noir).toBeDefined();
      expect(noir.name).toBe("تشكيلة نوار");
    });

    it("returns a localized design detail with specifications", async () => {
      const res = await request(http)
        .get("/client/designs/noir-necklace-01")
        .set("Cookie", cookie)
        .expect(200);
      expect(res.body.name).toBe("عقد نوار المتدرج");
      expect(res.body.material).toContain("ذهب");
      expect(res.body.specifications[0].key).toBe("الحجر");
      expect(res.body.imageUrls.length).toBeGreaterThan(0);
    });
  });

  describe("client flow (English client)", () => {
    let cookie: string;

    it("logs in and sees the catalog in English", async () => {
      const login = await request(http)
        .post("/auth/validate-key")
        .send({ houseKey: LAYLA_KEY })
        .expect(201);
      cookie = cookieOf(login);

      const res = await request(http)
        .get("/client/collections")
        .set("Cookie", cookie)
        .expect(200);
      const oasis = res.body.find((c: { slug: string }) => c.slug === "oasis");
      expect(oasis).toBeDefined();
      expect(oasis.name).toBe("Oasis");
    });
  });

  describe("admin catalog + purchase flow", () => {
    let adminCookie: string;
    let clientCookie: string;
    let designId: string;
    let pieceId: string;

    it("admin logs in", async () => {
      const res = await request(http)
        .post("/admin/auth/login")
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        .expect(201);
      adminCookie = cookieOf(res);
      expect(res.body.role).toBe("SUPER_ADMIN");
    });

    it("admin lists collections and designs (bilingual fields)", async () => {
      const collections = await request(http)
        .get("/admin/collections")
        .set("Cookie", adminCookie)
        .expect(200);
      expect(collections.body.total).toBeGreaterThanOrEqual(3);
      expect(collections.body.items[0]).toHaveProperty("nameAr");

      const designs = await request(http)
        .get("/admin/designs")
        .set("Cookie", adminCookie)
        .expect(200);
      expect(designs.body.total).toBeGreaterThanOrEqual(9);
      const noirNecklace = designs.body.items.find(
        (d: { slug: string }) => d.slug === "noir-necklace-01",
      );
      expect(noirNecklace.nameAr).toBe("عقد نوار المتدرج");
      designId = noirNecklace.id;
    });

    it("admin uploads a design image", async () => {
      const res = await request(http)
        .post(`/admin/designs/${designId}/images`)
        .set("Cookie", adminCookie)
        .attach("file", TINY_JPEG, { filename: "extra.jpg", contentType: "image/jpeg" })
        .expect(201);
      expect(res.body.imageUrls.length).toBeGreaterThanOrEqual(2);
    });

    it("admin registers a fresh piece for purchase", async () => {
      const res = await request(http)
        .post("/admin/pieces")
        .set("Cookie", adminCookie)
        .send({ designId })
        .expect(201);
      pieceId = res.body.id;
      expect(res.body.status).toBe("AVAILABLE");
      expect(res.body.serialNumber).toMatch(/^DADAN-/);
    });

    it("client adds the piece to the cart and checks out (mock payment)", async () => {
      const login = await request(http)
        .post("/auth/validate-key")
        .send({ houseKey: AMIRA_KEY })
        .expect(201);
      clientCookie = cookieOf(login);

      await request(http)
        .post("/client/cart")
        .set("Cookie", clientCookie)
        .send({ pieceId })
        .expect(201);

      const checkout = await request(http)
        .post("/client/checkout")
        .set("Cookie", clientCookie)
        .send({
          shippingAddress: {
            fullName: "Amira Al-Rashid",
            line1: "King Fahd Road",
            city: "Riyadh",
            region: "Riyadh",
            country: "SA",
            postalCode: "11564",
            phone: "+966500000000",
          },
          paymentMethod: "MADA",
          paymentToken: "tok_mock_e2e",
        })
        .expect(201);

      expect(checkout.body.orderId).toBeDefined();
      expect(checkout.body.orderStatus).toBe("PAID");
      expect(checkout.body.totalAmount).toBeGreaterThan(0);
    });

    it("the purchased piece appears in the wardrobe with a certificate", async () => {
      // Certificate generation is asynchronous after checkout; poll briefly.
      let certificate: { pdfUrl?: string } | null = null;
      for (let attempt = 0; attempt < 20 && !certificate; attempt++) {
        const res = await request(http)
          .get(`/client/wardrobe/${pieceId}`)
          .set("Cookie", clientCookie)
          .expect(200);
        certificate = res.body.certificate;
        if (!certificate) await new Promise((r) => setTimeout(r, 500));
      }
      expect(certificate).toBeTruthy();

      const cert = await request(http)
        .get(`/client/wardrobe/${pieceId}/certificate`)
        .set("Cookie", clientCookie)
        .expect(200);
      expect(cert.body.certificateNumber).toMatch(/^CERT-/);
      expect(cert.body.pdfUrl).toBeTruthy();
      expect(cert.body.qrCodeData).toContain("/verify?serial=");
    });

    it("publicly verifies the purchased piece without exposing the owner", async () => {
      const cert = await request(http)
        .get(`/client/wardrobe/${pieceId}/certificate`)
        .set("Cookie", clientCookie)
        .expect(200);
      const qrUrl = new URL(cert.body.qrCodeData);
      const serial = qrUrl.searchParams.get("serial")!;
      const token = qrUrl.searchParams.get("token")!;

      const res = await request(http)
        .get("/verify")
        .query({ serial, token })
        .set("Accept-Language", "en")
        .expect(200);

      expect(res.body.serialNumber).toBe(serial);
      expect(res.body.pieceName).toBe("Noir Cascade Necklace");
      expect(JSON.stringify(res.body)).not.toContain("Amira");
      expect(JSON.stringify(res.body)).not.toContain("أميرة");
    });
  });
});
