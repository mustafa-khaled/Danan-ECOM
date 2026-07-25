import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ActorType } from "@dadan/db";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import * as QRCode from "qrcode";
import { containsArabic, shapeArabicForPdf } from "./arabic-text";
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
  /** Noto Naskh Arabic bytes, loaded once (bundled next to this module). */
  private arabicFontBytes: Buffer | null | undefined;

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

    if (!piece) throw new NotFoundException("errors.PIECE_NOT_FOUND");

    const owner = await this.prisma.db.client.findUnique({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException("errors.CLIENT_NOT_FOUND");

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
      pieceNameAr: piece.design.nameAr,
      collectionName: piece.design.collection.name,
      collectionNameAr: piece.design.collection.nameAr,
      serialNumber: piece.serialNumber,
      material: piece.design.material,
      materialAr: piece.design.materialAr,
      weight: piece.design.weight.toString(),
      dimensions: piece.design.dimensions,
      dimensionsAr: piece.design.dimensionsAr,
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
    if (!piece) throw new NotFoundException("errors.PIECE_NOT_FOUND");

    const certificate = await this.prisma.db.certificate.findFirst({
      where: { pieceId, ownerId: clientId, isActive: true },
    });
    if (!certificate) throw new NotFoundException("errors.CERTIFICATE_NOT_FOUND");

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
    if (!piece) throw new NotFoundException("errors.PIECE_NOT_FOUND");

    const certificate = await this.prisma.db.certificate.findFirst({
      where: { pieceId, ownerId: clientId, isActive: true },
    });
    if (!certificate?.pdfUrl) throw new NotFoundException("errors.CERTIFICATE_NOT_FOUND");

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

  private loadArabicFontBytes(): Buffer | null {
    if (this.arabicFontBytes !== undefined) return this.arabicFontBytes;
    try {
      this.arabicFontBytes = readFileSync(
        path.join(__dirname, "fonts", "NotoNaskhArabic-Regular.ttf"),
      );
    } catch {
      // Certificates degrade to English-only rather than failing generation.
      this.arabicFontBytes = null;
    }
    return this.arabicFontBytes;
  }

  private async renderPdf(params: {
    pieceName: string;
    pieceNameAr: string | null;
    collectionName: string;
    collectionNameAr: string | null;
    serialNumber: string;
    material: string;
    materialAr: string | null;
    weight: string;
    dimensions: string;
    dimensionsAr: string | null;
    specifications: { key: string; keyAr: string | null; value: string; valueAr: string | null }[];
    ownerName: string;
    certificateNumber: string;
    issuedAt: Date;
    qrPng: Buffer;
    imageBytes: Buffer | null;
  }): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);
    const page = pdf.addPage([595, 842]);
    const { width, height } = page.getSize();
    const font = await pdf.embedFont(StandardFonts.TimesRoman);
    const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
    const mono = await pdf.embedFont(StandardFonts.Courier);

    const arabicFontBytes = this.loadArabicFontBytes();
    const arabicFont = arabicFontBytes
      ? await pdf.embedFont(new Uint8Array(arabicFontBytes), { subset: true })
      : null;

    const drawArabic = (
      text: string,
      opts: { rightX: number; y: number; size: number; color: ReturnType<typeof rgb> },
    ) => {
      if (!arabicFont) return;
      const shaped = shapeArabicForPdf(text);
      const textWidth = arabicFont.widthOfTextAtSize(shaped, opts.size);
      page.drawText(shaped, {
        x: opts.rightX - textWidth,
        y: opts.y,
        size: opts.size,
        font: arabicFont,
        color: opts.color,
      });
    };

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

    // Arabic counterparts of the header, right-aligned (RTL reading edge).
    drawArabic("دادن الرقمية", {
      rightX: width - 50,
      y: height - 60,
      size: 20,
      color: rgb(0.85, 0.75, 0.45),
    });
    drawArabic("شهادة أصالة", {
      rightX: width - 50,
      y: height - 95,
      size: 15,
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

    // [label, English value, optional Arabic value shown right-aligned]
    const fields: [string, string, string | null][] = [
      ["Piece", params.pieceName, params.pieceNameAr],
      ["Collection", params.collectionName, params.collectionNameAr],
      ["Serial Number", params.serialNumber, null],
      ["Material", params.material, params.materialAr],
      ["Weight", `${params.weight} g`, null],
      ["Dimensions", params.dimensions, params.dimensionsAr],
      [
        "Owner",
        // Names written in Arabic script need shaping; keep them out of the
        // Latin column and render on the Arabic side instead.
        containsArabic(params.ownerName) ? "" : params.ownerName,
        containsArabic(params.ownerName) ? params.ownerName : null,
      ],
      ["Certificate No.", params.certificateNumber, null],
      ["Issued", params.issuedAt.toISOString().split("T")[0]!, null],
    ];

    for (const spec of params.specifications) {
      fields.push([spec.key, spec.value, spec.valueAr]);
    }

    for (const [label, value, arValue] of fields) {
      page.drawText(`${label}:`, {
        x: 50,
        y: yPos,
        size: 11,
        font: fontBold,
        color: rgb(0.85, 0.75, 0.45),
      });
      if (value) {
        page.drawText(value, {
          x: 180,
          y: yPos,
          size: 11,
          font: mono,
          color: rgb(0.9, 0.9, 0.9),
        });
      }
      if (arValue) {
        // The QR code occupies the bottom-right corner; keep low rows clear of it.
        const rightX = yPos < 150 ? width - 145 : width - 50;
        drawArabic(arValue, {
          rightX,
          y: yPos,
          size: 11,
          color: rgb(0.75, 0.75, 0.75),
        });
      }
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
