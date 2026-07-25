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
    const rateLimitKey = `verify:${ipAddress}`;
    const limited = await this.redis.isRateLimited(rateLimitKey, 30, 60);
    if (limited) {
      throw new HttpException("errors.TOO_MANY_REQUESTS", HttpStatus.TOO_MANY_REQUESTS);
    }

    const piece = await this.prisma.db.piece.findUnique({
      where: { serialNumber: serial },
      include: {
        design: {
          include: {
            collection: true,
            specifications: { orderBy: { sortOrder: "asc" } },
          },
        },
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
      pieceName: pickLocalized(locale, piece.design.name, piece.design.nameAr),
      collection: pickLocalized(
        locale,
        piece.design.collection.name,
        piece.design.collection.nameAr,
      ),
      serialNumber: piece.serialNumber,
      material: pickLocalized(
        locale,
        piece.design.material,
        piece.design.materialAr,
      ),
      weight: piece.design.weight,
      dimensions: pickLocalized(
        locale,
        piece.design.dimensions,
        piece.design.dimensionsAr,
      ),
      specifications: localizeSpecifications(piece.design.specifications, locale),
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
