import { randomUUID } from "node:crypto";
import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ActorType } from "@dadan/db";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import * as QRCode from "qrcode";
import {
  certificatePdfKey,
  ALLOWED_PDF_MIME,
} from "@dadan/storage";
import {
  createVerificationToken,
  generateCertificateNumber,
} from "@dadan/utils";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { paginationParams } from "../common/constants";

@Injectable()
export class CertificatesService {
  private readonly baseUrl: string;
  private readonly signingSecret: string;
  private readonly watermarkText: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    config: ConfigService,
  ) {
    this.baseUrl = config.get<string>("BASE_URL") ?? "http://localhost:3000";
    this.signingSecret = config.getOrThrow<string>("CERT_SIGNING_SECRET");
    this.watermarkText =
      config.get<string>("PDF_WATERMARK_TEXT") ?? "DADAN DIJITAL — AUTHENTICATED";
  }

  async generateCertificate(
    pieceId: string,
    ownerId: string,
    actorId?: string,
  ) {
    const piece = await this.prisma.db.piece.findUnique({
      where: { id: pieceId },
      include: {
        design: {
          include: {
            collection: true,
            specifications: { orderBy: { sortOrder: "asc" } },
          },
        },
        currentOwner: true,
      },
    });

    if (!piece) throw new NotFoundException("Piece not found");

    const owner = await this.prisma.db.client.findUnique({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException("Owner not found");

    const year = new Date().getFullYear();
    const certificateNumber = generateCertificateNumber(year);
    const certificateId = randomUUID();

    const token = createVerificationToken(
      piece.serialNumber,
      certificateId,
      this.signingSecret,
    );
    const verifyUrl = `${this.baseUrl}/verify?serial=${encodeURIComponent(piece.serialNumber)}&token=${token}`;

    const qrPng = await QRCode.toBuffer(verifyUrl, { type: "png", width: 200 });

    let imageBytes: Buffer | null = null;
    const primaryImage = piece.design.imageUrls[0];
    if (primaryImage) {
      try {
        imageBytes = await this.storage.download(primaryImage);
      } catch {
        imageBytes = null;
      }
    }

    const pdfBuffer = await this.renderPdf({
      pieceName: piece.design.name,
      collectionName: piece.design.collection.name,
      serialNumber: piece.serialNumber,
      material: piece.design.material,
      weight: piece.design.weight.toString(),
      dimensions: piece.design.dimensions,
      specifications: piece.design.specifications,
      ownerName: owner.displayName,
      certificateNumber,
      issuedAt: new Date(),
      qrPng,
      imageBytes,
    });

    const pdfKey = certificatePdfKey(certificateId);
    await this.storage.upload(pdfKey, pdfBuffer, { contentType: ALLOWED_PDF_MIME });

    const certificate = await this.prisma.db.$transaction(async (tx) => {
      await tx.certificate.updateMany({
        where: { pieceId, isActive: true },
        data: { isActive: false },
      });

      return tx.certificate.create({
        data: {
          id: certificateId,
          pieceId,
          ownerId,
          certificateNumber,
          pdfUrl: pdfKey,
          qrCodeData: verifyUrl,
          isActive: true,
        },
      });
    });

    await this.audit.log({
      actorType: actorId ? ActorType.ADMIN : ActorType.SYSTEM,
      actorId: actorId ?? "system",
      action: "CERTIFICATE_GENERATED",
      targetType: "Certificate",
      targetId: certificate.id,
      metadata: { pieceId, ownerId },
    });

    return certificate;
  }

  async regenerateCertificate(pieceId: string, newOwnerId: string, adminId: string) {
    return this.generateCertificate(pieceId, newOwnerId, adminId);
  }

  async getClientCertificate(clientId: string, pieceId: string) {
    const piece = await this.prisma.db.piece.findFirst({
      where: { id: pieceId, currentOwnerId: clientId },
    });
    if (!piece) throw new NotFoundException("Piece not found");

    const certificate = await this.prisma.db.certificate.findFirst({
      where: { pieceId, ownerId: clientId, isActive: true },
    });
    if (!certificate) throw new NotFoundException("Certificate not found");

    const pdfUrl = certificate.pdfUrl
      ? await this.storage.getSignedUrl(certificate.pdfUrl, { expiresInSeconds: 3600 })
      : null;

    return {
      certificateNumber: certificate.certificateNumber,
      issuedAt: certificate.issuedAt,
      pdfUrl,
      qrCodeData: certificate.qrCodeData,
    };
  }

  async getCertificateDownloadUrl(clientId: string, pieceId: string): Promise<string> {
    const piece = await this.prisma.db.piece.findFirst({
      where: { id: pieceId, currentOwnerId: clientId },
    });
    if (!piece) throw new NotFoundException("Piece not found");

    const certificate = await this.prisma.db.certificate.findFirst({
      where: { pieceId, ownerId: clientId, isActive: true },
    });
    if (!certificate?.pdfUrl) throw new NotFoundException("Certificate not found");

    return this.storage.getSignedUrl(certificate.pdfUrl, { expiresInSeconds: 3600 });
  }

  async listCertificates(page?: number, limit?: number) {
    const { skip, take, page: p, limit: l } = paginationParams(page, limit);
    const [items, total] = await Promise.all([
      this.prisma.db.certificate.findMany({
        skip,
        take,
        orderBy: { issuedAt: "desc" },
        include: {
          piece: { select: { serialNumber: true, design: { select: { name: true } } } },
          owner: { select: { displayName: true } },
        },
      }),
      this.prisma.db.certificate.count(),
    ]);

    return { items, total, page: p, limit: l };
  }

  private async renderPdf(params: {
    pieceName: string;
    collectionName: string;
    serialNumber: string;
    material: string;
    weight: string;
    dimensions: string;
    specifications: { key: string; value: string }[];
    ownerName: string;
    certificateNumber: string;
    issuedAt: Date;
    qrPng: Buffer;
    imageBytes: Buffer | null;
  }): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const { width, height } = page.getSize();
    const font = await pdf.embedFont(StandardFonts.TimesRoman);
    const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
    const mono = await pdf.embedFont(StandardFonts.Courier);

    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.05, 0.05, 0.05),
    });

    page.drawText("DADAN DIJITAL", {
      x: 50,
      y: height - 60,
      size: 24,
      font: fontBold,
      color: rgb(0.85, 0.75, 0.45),
    });

    page.drawText("Certificate of Authenticity", {
      x: 50,
      y: height - 95,
      size: 18,
      font,
      color: rgb(1, 1, 1),
    });

    let yPos = height - 140;

    if (params.imageBytes) {
      try {
        const img = await pdf.embedPng(params.imageBytes).catch(() =>
          pdf.embedJpg(params.imageBytes!),
        );
        const imgDims = img.scale(0.4);
        page.drawImage(img, {
          x: (width - imgDims.width) / 2,
          y: yPos - imgDims.height,
          width: imgDims.width,
          height: imgDims.height,
        });
        yPos -= imgDims.height + 30;
      } catch {
        yPos -= 20;
      }
    }

    const fields: [string, string][] = [
      ["Piece", params.pieceName],
      ["Collection", params.collectionName],
      ["Serial Number", params.serialNumber],
      ["Material", params.material],
      ["Weight", `${params.weight} g`],
      ["Dimensions", params.dimensions],
      ["Owner", params.ownerName],
      ["Certificate No.", params.certificateNumber],
      ["Issued", params.issuedAt.toISOString().split("T")[0]!],
    ];

    for (const spec of params.specifications) {
      fields.push([spec.key, spec.value]);
    }

    for (const [label, value] of fields) {
      page.drawText(`${label}:`, {
        x: 50,
        y: yPos,
        size: 11,
        font: fontBold,
        color: rgb(0.85, 0.75, 0.45),
      });
      page.drawText(value, {
        x: 180,
        y: yPos,
        size: 11,
        font: mono,
        color: rgb(0.9, 0.9, 0.9),
      });
      yPos -= 22;
    }

    const qrImage = await pdf.embedPng(params.qrPng);
    page.drawImage(qrImage, {
      x: width - 130,
      y: 50,
      width: 80,
      height: 80,
    });

    page.drawText(this.watermarkText, {
      x: 100,
      y: height / 2,
      size: 36,
      font: fontBold,
      color: rgb(1, 1, 1),
      opacity: 0.08,
      rotate: degrees(45),
    });

    return Buffer.from(await pdf.save());
  }
}
