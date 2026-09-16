import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { VerificationResult } from "@dadan/db";
import type { Locale } from "@dadan/types";
import { verifyVerificationToken } from "@dadan/utils";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import {
  localizeSpecifications,
  pickLocalized,
} from "../common/i18n/localize";

@Injectable()
export class VerifyService {
  private readonly signingSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    config: ConfigService,
  ) {
    this.signingSecret = config.getOrThrow<string>("CERT_SIGNING_SECRET");
  }

  async verify(
    serial: string,
    token: string,
    ipAddress: string,
    clientId?: string,
    locale: Locale = "ar",
  ) {
    // L-03: Reduced from 30 to 15 requests/minute to limit serial enumeration
    const rateLimitKey = `verify:${ipAddress}`;
    const limited = await this.redis.isRateLimited(rateLimitKey, 15, 60);
    if (limited) {
      throw new HttpException("errors.TOO_MANY_REQUESTS", HttpStatus.TOO_MANY_REQUESTS);
    }

    const piece = await this.prisma.db.piece.findUnique({
      where: { serialNumber: serial },
      include: {
        collection: true,
        specifications: { orderBy: { sortOrder: "asc" } },
        certificates: { where: { isActive: true }, take: 1 },
      },
    });

    if (!piece || !piece.certificates[0]) {
      await this.logVerification(serial, null, VerificationResult.NOT_FOUND, ipAddress, clientId);
      throw new NotFoundException("errors.CERTIFICATE_NOT_FOUND");
    }

    const certificate = piece.certificates[0];
    const valid = verifyVerificationToken(
      serial,
      certificate.id,
      token,
      this.signingSecret,
    );

    if (!valid) {
      await this.logVerification(serial, piece.id, VerificationResult.NOT_FOUND, ipAddress, clientId);
      throw new NotFoundException("errors.CERTIFICATE_NOT_FOUND");
    }

    await this.logVerification(serial, piece.id, VerificationResult.FOUND, ipAddress, clientId);

    return {
      pieceName: pickLocalized(locale, piece.name, piece.nameAr),
      collection: pickLocalized(
        locale,
        piece.collection.name,
        piece.collection.nameAr,
      ),
      serialNumber: piece.serialNumber,
      material: pickLocalized(
        locale,
        piece.material,
        piece.materialAr,
      ),
      weight: piece.weight,
      dimensions: pickLocalized(
        locale,
        piece.dimensions,
        piece.dimensionsAr,
      ),
      specifications: localizeSpecifications(piece.specifications, locale),
      issuedAt: certificate.issuedAt,
    };
  }

  private async logVerification(
    serialNumber: string,
    pieceId: string | null,
    result: VerificationResult,
    ipAddress: string,
    clientId?: string,
  ) {
    await this.prisma.db.verificationLog.create({
      data: {
        serialNumber,
        pieceId,
        result,
        ipAddress,
        clientId: clientId ?? null,
      },
    });
  }
}
