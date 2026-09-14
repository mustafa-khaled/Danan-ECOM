import { VisibilityService } from "../src/visibility/visibility.service";

describe("VisibilityService", () => {
  const service = new VisibilityService();

  it("builds a class-assignment Prisma filter", () => {
    expect(service.prismaFilter("class-c")).toEqual({
      isVisible: true,
      classes: { some: { classId: "class-c" } },
    });
  });

  it("grants access only when the collection is visible and assigned to the class", () => {
    expect(
      service.canAccessCollection("class-c", {
        isVisible: true,
        classes: [{ classId: "class-c" }],
      }),
    ).toBe(true);
    expect(
      service.canAccessCollection("class-c", {
        isVisible: true,
        classes: [{ classId: "class-a" }],
      }),
    ).toBe(false);
    expect(
      service.canAccessCollection("class-c", {
        isVisible: false,
        classes: [{ classId: "class-c" }],
      }),
    ).toBe(false);
    expect(
      service.canAccessCollection("class-c", {
        isVisible: true,
        classes: [],
      }),
    ).toBe(false);
  });

  it("grants piece access only when the piece is active and the collection is allowed", () => {
    expect(
      service.canAccessPiece("class-a", {
        isActive: true,
        collection: {
          isVisible: true,
          classes: [{ classId: "class-a" }],
        },
      }),
    ).toBe(true);
    expect(
      service.canAccessPiece("class-a", {
        isActive: false,
        collection: {
          isVisible: true,
          classes: [{ classId: "class-a" }],
        },
      }),
    ).toBe(false);
  });
});
