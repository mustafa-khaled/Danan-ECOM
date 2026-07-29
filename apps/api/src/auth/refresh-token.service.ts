import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../redis/redis.service";
import { AUTH_FAILURE_MESSAGE } from "../common/constants";

interface RefreshTokenRecord {
  sub: string;
  familyId: string;
}

type RotateScriptResult = ["OK", string] | ["REUSE", string] | ["MISSING"];

function refreshHashKey(audience: string, tokenHash: string): string {
  return `auth:refresh:hash:${audience}:${tokenHash}`;
}

function refreshRevokedKey(audience: string, tokenHash: string): string {
  return `auth:refresh:revoked:${audience}:${tokenHash}`;
}

function refreshFamilyKey(audience: string, familyId: string): string {
  return `auth:refresh:family:${audience}:${familyId}`;
}

function refreshSubjectKey(audience: string, subjectId: string): string {
  return `auth:refresh:subject:${audience}:${subjectId}`;
}

/** Atomically rotate one refresh token or detect reuse. */
const ROTATE_REFRESH_SCRIPT = `
local hashKey = KEYS[1]
local revokedKey = KEYS[2]
local newHashKey = KEYS[3]
local ttl = tonumber(ARGV[1])
local tokenHash = ARGV[2]
local newTokenHash = ARGV[3]
local newRecord = ARGV[4]
local audience = ARGV[5]

local raw = redis.call('GETDEL', hashKey)
if raw then
  local record = cjson.decode(raw)
  local familyKey = 'auth:refresh:family:' .. audience .. ':' .. record.familyId
  redis.call('SET', revokedKey, raw, 'EX', ttl)
  redis.call('SREM', familyKey, tokenHash)
  redis.call('SET', newHashKey, newRecord, 'EX', ttl)
  redis.call('SADD', familyKey, newTokenHash)
  redis.call('EXPIRE', familyKey, ttl)
  return {'OK', raw}
end

if redis.call('EXISTS', revokedKey) == 1 then
  return {'REUSE', redis.call('GET', revokedKey)}
end

return {'MISSING'}
`;

@Injectable()
export class RefreshTokenService {
  private readonly pepper: string;

  constructor(
    private readonly redis: RedisService,
    config: ConfigService,
  ) {
    this.pepper = config.getOrThrow<string>("JWT_SECRET");
  }

  async issueRefreshToken(
    audience: string,
    subjectId: string,
    ttlSeconds: number,
  ): Promise<{ token: string; familyId: string }> {
    const familyId = randomUUID();
    return this.createToken(audience, subjectId, familyId, ttlSeconds);
  }

  /** Read subject from an active refresh token without rotating. */
  async resolveRefreshToken(
    token: string,
    audience: string,
  ): Promise<RefreshTokenRecord | null> {
    if (!this.isValidTokenFormat(token)) {
      return null;
    }

    const tokenHash = this.hashToken(token);
    const raw = await this.redis.get(refreshHashKey(audience, tokenHash));
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as RefreshTokenRecord;
    } catch {
      return null;
    }
  }

  async rotateRefreshToken(
    token: string,
    audience: string,
    ttlSeconds: number,
  ): Promise<{ token: string; subjectId: string; familyId: string }> {
    if (!this.isValidTokenFormat(token)) {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    const tokenHash = this.hashToken(token);
    const newTokenId = randomUUID();
    const newSecret = randomBytes(32).toString("base64url");
    const newToken = `${newTokenId}.${newSecret}`;
    const newTokenHash = this.hashToken(newToken);

    const record = await this.resolveRefreshToken(token, audience);
    if (!record) {
      return this.handleMissingOrReuse(tokenHash, audience, ttlSeconds);
    }

    const newRecord = JSON.stringify({
      sub: record.sub,
      familyId: record.familyId,
    } satisfies RefreshTokenRecord);

    const result = (await this.redis.eval(
      ROTATE_REFRESH_SCRIPT,
      [
        refreshHashKey(audience, tokenHash),
        refreshRevokedKey(audience, tokenHash),
        refreshHashKey(audience, newTokenHash),
      ],
      [ttlSeconds, tokenHash, newTokenHash, newRecord, audience],
    )) as RotateScriptResult;

    if (result[0] === "OK") {
      return {
        token: newToken,
        subjectId: record.sub,
        familyId: record.familyId,
      };
    }

    if (result[0] === "REUSE") {
      await this.handleReuse(result[1], audience, ttlSeconds);
    }

    throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
  }

  async revokeRefreshToken(
    token: string,
    audience: string,
    ttlSeconds: number,
  ): Promise<void> {
    if (!this.isValidTokenFormat(token)) {
      return;
    }

    const tokenHash = this.hashToken(token);
    const hashKey = refreshHashKey(audience, tokenHash);
    const raw = await this.redis.get(hashKey);
    if (!raw) {
      return;
    }

    let record: RefreshTokenRecord;
    try {
      record = JSON.parse(raw) as RefreshTokenRecord;
    } catch {
      return;
    }

    await this.markRevoked(audience, tokenHash, record, ttlSeconds);
    await this.redis.del(hashKey);
    await this.removeFromFamily(audience, record.familyId, tokenHash);
  }

  async revokeFamily(
    familyId: string,
    audience: string,
    ttlSeconds: number,
  ): Promise<void> {
    const familyKey = refreshFamilyKey(audience, familyId);
    const tokenHashes = await this.redis.smembers(familyKey);

    for (const tokenHash of tokenHashes) {
      const hashKey = refreshHashKey(audience, tokenHash);
      const raw = await this.redis.get(hashKey);
      if (raw) {
        let record: RefreshTokenRecord;
        try {
          record = JSON.parse(raw) as RefreshTokenRecord;
        } catch {
          continue;
        }
        await this.markRevoked(audience, tokenHash, record, ttlSeconds);
      } else {
        await this.redis.setWithExpiry(
          refreshRevokedKey(audience, tokenHash),
          JSON.stringify({ familyId }),
          ttlSeconds,
        );
      }
      await this.redis.del(hashKey);
    }

    await this.redis.del(familyKey);
  }

  async revokeAllForSubject(
    audience: string,
    subjectId: string,
    ttlSeconds: number,
  ): Promise<void> {
    const subjectKey = refreshSubjectKey(audience, subjectId);
    const familyIds = await this.redis.smembers(subjectKey);

    for (const familyId of familyIds) {
      await this.revokeFamily(familyId, audience, ttlSeconds);
    }

    await this.redis.del(subjectKey);
  }

  private async handleMissingOrReuse(
    tokenHash: string,
    audience: string,
    ttlSeconds: number,
  ): Promise<never> {
    const revokedKey = refreshRevokedKey(audience, tokenHash);
    if (await this.redis.exists(revokedKey)) {
      const raw = await this.redis.get(revokedKey);
      if (raw) {
        await this.handleReuse(raw, audience, ttlSeconds);
      }
    }

    throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
  }

  /**
   * On reuse, revoke the family only when no active sibling exists (stolen token).
   * If another tab already rotated, reject without wiping the valid session.
   */
  private async handleReuse(
    revokedRaw: string,
    audience: string,
    ttlSeconds: number,
  ): Promise<never> {
    let record: RefreshTokenRecord;
    try {
      record = JSON.parse(revokedRaw) as RefreshTokenRecord;
    } catch {
      throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
    }

    const hasActiveSibling = await this.familyHasActiveToken(
      audience,
      record.familyId,
    );

    if (!hasActiveSibling) {
      await this.revokeFamily(record.familyId, audience, ttlSeconds);
      await this.removeSubjectFamily(audience, record.sub, record.familyId);
    }

    throw new UnauthorizedException(AUTH_FAILURE_MESSAGE);
  }

  private async familyHasActiveToken(
    audience: string,
    familyId: string,
  ): Promise<boolean> {
    const familyKey = refreshFamilyKey(audience, familyId);
    const tokenHashes = await this.redis.smembers(familyKey);

    for (const tokenHash of tokenHashes) {
      const hashKey = refreshHashKey(audience, tokenHash);
      if (await this.redis.exists(hashKey)) {
        return true;
      }
    }

    return false;
  }

  private async createToken(
    audience: string,
    subjectId: string,
    familyId: string,
    ttlSeconds: number,
  ): Promise<{ token: string; familyId: string }> {
    const tokenId = randomUUID();
    const secret = randomBytes(32).toString("base64url");
    const token = `${tokenId}.${secret}`;
    const tokenHash = this.hashToken(token);
    const record: RefreshTokenRecord = { sub: subjectId, familyId };

    await this.redis.setWithExpiry(
      refreshHashKey(audience, tokenHash),
      JSON.stringify(record),
      ttlSeconds,
    );
    await this.redis.sadd(refreshFamilyKey(audience, familyId), tokenHash);
    await this.redis.expire(refreshFamilyKey(audience, familyId), ttlSeconds);
    await this.redis.sadd(refreshSubjectKey(audience, subjectId), familyId);
    await this.redis.expire(refreshSubjectKey(audience, subjectId), ttlSeconds);

    return { token, familyId };
  }

  private async markRevoked(
    audience: string,
    tokenHash: string,
    record: RefreshTokenRecord,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.setWithExpiry(
      refreshRevokedKey(audience, tokenHash),
      JSON.stringify({ familyId: record.familyId, sub: record.sub }),
      ttlSeconds,
    );
  }

  private async removeFromFamily(
    audience: string,
    familyId: string,
    tokenHash: string,
  ): Promise<void> {
    await this.redis.srem(refreshFamilyKey(audience, familyId), tokenHash);
  }

  private async removeSubjectFamily(
    audience: string,
    subjectId: string,
    familyId: string,
  ): Promise<void> {
    await this.redis.srem(refreshSubjectKey(audience, subjectId), familyId);
  }

  private hashToken(token: string): string {
    return createHmac("sha256", this.pepper).update(token).digest("base64url");
  }

  private isValidTokenFormat(token: string): boolean {
    const dot = token.indexOf(".");
    if (dot === -1) return false;
    const tokenId = token.slice(0, dot);
    const secret = token.slice(dot + 1);
    return Boolean(tokenId && secret.length >= 32);
  }
}
