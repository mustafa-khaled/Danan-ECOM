import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { RefreshTokenService } from "../src/auth/refresh-token.service";
import { RedisService } from "../src/redis/redis.service";
import { JWT_AUDIENCE_CLIENT } from "../src/common/constants";

describe("RefreshTokenService", () => {
  let service: RefreshTokenService;

  const store = new Map<string, string>();
  const sets = new Map<string, Set<string>>();

  const redisMock = {
    setWithExpiry: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    get: jest.fn(async (key: string) => store.get(key) ?? null),
    del: jest.fn(async (key: string) => {
      store.delete(key);
      sets.delete(key);
    }),
    exists: jest.fn(async (key: string) => store.has(key)),
    sadd: jest.fn(async (key: string, ...members: string[]) => {
      const set = sets.get(key) ?? new Set<string>();
      for (const member of members) set.add(member);
      sets.set(key, set);
    }),
    srem: jest.fn(async (key: string, ...members: string[]) => {
      const set = sets.get(key);
      if (!set) return;
      for (const member of members) set.delete(member);
    }),
    smembers: jest.fn(async (key: string) => Array.from(sets.get(key) ?? [])),
    expire: jest.fn(async () => undefined),
    eval: jest.fn(
      async (_script: string, keys: string[], args: (string | number)[]) => {
        const hashKey = keys[0]!;
        const revokedKey = keys[1]!;
        const newHashKey = keys[2]!;
        const tokenHash = String(args[1]);
        const newTokenHash = String(args[2]);
        const newRecord = String(args[3]);
        const audience = String(args[4]);

        const raw = store.get(hashKey);
        if (raw) {
          store.delete(hashKey);
          store.set(revokedKey, raw);
          const record = JSON.parse(raw) as { familyId: string };
          const familyKey = `auth:refresh:family:${audience}:${record.familyId}`;
          const familySet = sets.get(familyKey) ?? new Set<string>();
          familySet.delete(tokenHash);
          familySet.add(newTokenHash);
          sets.set(familyKey, familySet);
          store.set(newHashKey, newRecord);
          return ["OK", raw];
        }

        if (store.has(revokedKey)) {
          return ["REUSE", store.get(revokedKey)];
        }

        return ["MISSING"];
      },
    ),
  };

  const configMock = {
    getOrThrow: jest.fn().mockReturnValue("test-jwt-secret-at-least-32-chars"),
  };

  beforeEach(async () => {
    store.clear();
    sets.clear();
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        { provide: RedisService, useValue: redisMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = module.get(RefreshTokenService);
  });

  it("issues a refresh token and stores it in Redis", async () => {
    const { token, familyId } = await service.issueRefreshToken(
      JWT_AUDIENCE_CLIENT,
      "user-1",
      3600,
    );

    expect(token).toContain(".");
    expect(familyId).toBeTruthy();
    expect(redisMock.setWithExpiry).toHaveBeenCalled();
    expect(redisMock.sadd).toHaveBeenCalled();
  });

  it("rotates a refresh token and returns a new one", async () => {
    const issued = await service.issueRefreshToken(
      JWT_AUDIENCE_CLIENT,
      "user-1",
      3600,
    );

    const rotated = await service.rotateRefreshToken(
      issued.token,
      JWT_AUDIENCE_CLIENT,
      3600,
    );

    expect(rotated.subjectId).toBe("user-1");
    expect(rotated.token).not.toBe(issued.token);
    expect(rotated.familyId).toBe(issued.familyId);
  });

  it("revokes a refresh token on logout", async () => {
    const issued = await service.issueRefreshToken(
      JWT_AUDIENCE_CLIENT,
      "user-1",
      3600,
    );

    await service.revokeRefreshToken(issued.token, JWT_AUDIENCE_CLIENT, 3600);

    await expect(
      service.rotateRefreshToken(issued.token, JWT_AUDIENCE_CLIENT, 3600),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("revokes the entire family when a revoked token is reused with no active sibling", async () => {
    const issued = await service.issueRefreshToken(
      JWT_AUDIENCE_CLIENT,
      "user-1",
      3600,
    );
    const rotated = await service.rotateRefreshToken(
      issued.token,
      JWT_AUDIENCE_CLIENT,
      3600,
    );

    await service.revokeRefreshToken(rotated.token, JWT_AUDIENCE_CLIENT, 3600);

    await expect(
      service.rotateRefreshToken(issued.token, JWT_AUDIENCE_CLIENT, 3600),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      service.rotateRefreshToken(rotated.token, JWT_AUDIENCE_CLIENT, 3600),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("does not revoke the family when a stale tab replays after rotation", async () => {
    const issued = await service.issueRefreshToken(
      JWT_AUDIENCE_CLIENT,
      "user-1",
      3600,
    );
    const rotated = await service.rotateRefreshToken(
      issued.token,
      JWT_AUDIENCE_CLIENT,
      3600,
    );

    await expect(
      service.rotateRefreshToken(issued.token, JWT_AUDIENCE_CLIENT, 3600),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      service.rotateRefreshToken(rotated.token, JWT_AUDIENCE_CLIENT, 3600),
    ).resolves.toMatchObject({ subjectId: "user-1" });
  });

  it("allows only one concurrent rotation to succeed", async () => {
    const issued = await service.issueRefreshToken(
      JWT_AUDIENCE_CLIENT,
      "user-1",
      3600,
    );

    const results = await Promise.allSettled([
      service.rotateRefreshToken(issued.token, JWT_AUDIENCE_CLIENT, 3600),
      service.rotateRefreshToken(issued.token, JWT_AUDIENCE_CLIENT, 3600),
    ]);

    const fulfilled = results.filter(
      (result): result is PromiseFulfilledResult<{
        token: string;
        subjectId: string;
        familyId: string;
      }> => result.status === "fulfilled",
    );
    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const winningRotation = fulfilled[0]!.value;
    await expect(
      service.rotateRefreshToken(
        winningRotation.token,
        JWT_AUDIENCE_CLIENT,
        3600,
      ),
    ).resolves.toBeDefined();
  });

  it("revokes all sessions for a subject", async () => {
    const first = await service.issueRefreshToken(
      JWT_AUDIENCE_CLIENT,
      "user-1",
      3600,
    );
    const second = await service.issueRefreshToken(
      JWT_AUDIENCE_CLIENT,
      "user-1",
      3600,
    );

    await service.revokeAllForSubject(JWT_AUDIENCE_CLIENT, "user-1", 3600);

    await expect(
      service.rotateRefreshToken(first.token, JWT_AUDIENCE_CLIENT, 3600),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      service.rotateRefreshToken(second.token, JWT_AUDIENCE_CLIENT, 3600),
    ).rejects.toThrow(UnauthorizedException);
  });
});
