import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { VerificationResult } from "@dadan/db";
import { verifyVerificationToken } from "@dadan/utils";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

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
  ) {
    const rateLimitKey = `verify:${ipAddress}`;
    const limited = await this.redis.isRateLimited(rateLimitKey, 30, 60);
    if (limited) {
      throw new HttpException("Too many requests", HttpStatus.TOO_MANY_REQUESTS);
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
      throw new NotFoundException("Certificate not found");
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
      throw new NotFoundException("Certificate not found");
    }

    await this.logVerification(serial, piece.id, VerificationResult.FOUND, ipAddress, clientId);

    return {
      pieceName: piece.design.name,
      collection: piece.design.collection.name,
      serialNumber: piece.serialNumber,
      material: piece.design.material,
      weight: piece.design.weight,
      dimensions: piece.design.dimensions,
      specifications: piece.design.specifications,
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
