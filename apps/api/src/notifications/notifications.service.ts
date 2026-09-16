import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { I18nService } from "nestjs-i18n";
import type { Locale } from "@dadan/types";
import * as nodemailer from "nodemailer";
import { DEFAULT_LOCALE, isLocale } from "../common/i18n/locale";
import { PrismaService } from "../prisma/prisma.service";

interface EmailContent {
  subject: string;
  heading: string;
  body: string;
  extraLine?: string;
}

type NotificationIcon = "verified" | "document" | "clock" | "envelope";

interface NotificationItem {
  id: string;
  icon: NotificationIcon;
  title: string;
  description: string;
  href: string;
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly fromEmail: string;
  private readonly adminEmail: string | undefined;

  constructor(
    private readonly i18n: I18nService,
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const smtpHost = config.get<string>("SMTP_HOST");
    const smtpPort = config.get<number>("SMTP_PORT");
    const smtpUser = config.get<string>("SMTP_USER");
    const smtpPass = config.get<string>("SMTP_PASS");

    this.fromEmail = config.get<string>("ADMIN_EMAIL") ?? "noreply@dadan.sa";
    this.adminEmail = config.get<string>("ADMIN_EMAIL");

    if (smtpHost && smtpPort) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
      });
      this.logger.log(`SMTP configured: ${smtpHost}:${smtpPort}`);
    } else {
      this.transporter = null;
      this.logger.warn("SMTP not configured - emails will be logged only");
    }
  }

  async list(clientId: string, locale: Locale = "ar") {
    const [orders, transfers, certificates] = await Promise.all([
      this.prisma.db.order.findMany({
        where: { clientId, status: { in: ["PAID", "FULFILLED", "PROCESSING"] } },
        orderBy: { placedAt: "desc" },
        take: 20,
        select: {
          id: true,
          placedAt: true,
          items: {
            take: 1,
            select: { nameSnapshot: true, pieceId: true },
          },
        },
      }),
      this.prisma.db.transferRequest.findMany({
        where: {
          OR: [{ fromClientId: clientId }, { toClientId: clientId }],
        },
        orderBy: { initiatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          status: true,
          initiatedAt: true,
          completedAt: true,
          piece: { select: { name: true, nameAr: true } },
        },
      }),
      this.prisma.db.certificate.findMany({
        where: { ownerId: clientId },
        orderBy: { issuedAt: "desc" },
        take: 20,
        select: {
          id: true,
          issuedAt: true,
          pieceId: true,
          piece: { select: { name: true, nameAr: true } },
        },
      }),
    ]);

    const items: NotificationItem[] = [];

    for (const order of orders) {
      const pieceName = order.items[0]?.nameSnapshot ?? "";
      items.push({
        id: `order-${order.id}`,
        icon: "envelope",
        title: locale === "ar" ? "طلب" : "Order",
        description:
          locale === "ar"
            ? `تم تأكيد طلبك${pieceName ? ` لـ ${pieceName}` : ""}.`
            : `Your order${pieceName ? ` for ${pieceName}` : ""} has been confirmed.`,
        href: `/beta/orders/${order.id}`,
        createdAt: order.placedAt,
      });
    }

    for (const transfer of transfers) {
      const pieceName =
        locale === "ar"
          ? (transfer.piece.nameAr ?? transfer.piece.name)
          : transfer.piece.name;
      const completed = ["APPROVED", "REJECTED", "CANCELLED"].includes(
        transfer.status,
      );
      items.push({
        id: `transfer-${transfer.id}`,
        icon: completed ? "verified" : "clock",
        title: locale === "ar" ? "نقل ملكية" : "Transfer",
        description:
          locale === "ar"
            ? `تحديث نقل ملكية ${pieceName}.`
            : `Ownership transfer update for ${pieceName}.`,
        href: `/beta/profile/transfers/${transfer.id}`,
        createdAt: transfer.completedAt ?? transfer.initiatedAt,
      });
    }

    for (const certificate of certificates) {
      const pieceName =
        locale === "ar"
          ? (certificate.piece.nameAr ?? certificate.piece.name)
          : certificate.piece.name;
      items.push({
        id: `cert-${certificate.id}`,
        icon: "document",
        title: locale === "ar" ? "شهادة" : "Certificate",
        description:
          locale === "ar"
            ? `صدرت شهادة ملكية لـ ${pieceName}.`
            : `Your ownership certificate for ${pieceName} has been issued.`,
        href: `/beta/profile/wardrobe/${certificate.pieceId}`,
        createdAt: certificate.issuedAt,
      });
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const weekAgo = new Date(startOfToday);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const today = items.filter((item) => item.createdAt >= startOfToday);
    const thisWeek = items.filter(
      (item) => item.createdAt < startOfToday && item.createdAt >= weekAgo,
    );

    return {
      groups: [
        { key: "today" as const, items: today.map((item) => this.toPublic(item)) },
        { key: "thisWeek" as const, items: thisWeek.map((item) => this.toPublic(item)) },
      ],
    };
  }

  private toPublic(item: NotificationItem) {
    return {
      id: item.id,
      icon: item.icon,
      title: item.title,
      description: item.description,
      href: item.href,
    };
  }

  private normalizeLocale(locale?: string): Locale {
    return isLocale(locale) ? locale : DEFAULT_LOCALE;
  }

  private buildContent(
    template: string,
    locale: Locale,
    args: Record<string, string>,
    extra?: { key: string; args: Record<string, string> },
  ): EmailContent {
    const t = (key: string, a: Record<string, string> = args) =>
      this.i18n.t(`emails.${template}.${key}`, { lang: locale, args: a });

    return {
      subject: t("subject"),
      heading: t("heading"),
      body: t("body"),
      extraLine: extra ? t(extra.key, extra.args) : undefined,
    };
  }

  private async sendTemplatedEmail(
    to: string,
    template: string,
    locale: Locale,
    args: Record<string, string>,
    extra?: { key: string; args: Record<string, string> },
  ) {
    const content = this.buildContent(template, locale, args, extra);
    const dir = locale === "ar" ? "rtl" : "ltr";
    const text = content.extraLine
      ? `${content.body}\n${content.extraLine}`
      : content.body;
    const html =
      `<div dir="${dir}"><h2>${content.heading}</h2><p>${content.body}</p>` +
      (content.extraLine ? `<p>${content.extraLine}</p>` : "") +
      `</div>`;

    await this.sendEmail(to, content.subject, text, html);
  }

  private async sendEmail(to: string, subject: string, text: string, html?: string) {
    if (!this.transporter) {
      this.logger.log(`[Email to ${to}] ${subject}: ${text}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject,
        text,
        html: html ?? text,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      // L-06: TODO — Consider adding a retry queue (e.g., BullMQ) for critical emails
      // (order confirmations, transfer notifications) instead of fire-and-forget.
      this.logger.error(`Failed to send email to ${to}: ${error}`);
    }
  }

  sendTransferInitiatedEmail(to: string, data: { transferId: string; locale?: string }) {
    void this.sendTemplatedEmail(to, "transferInitiated", this.normalizeLocale(data.locale), {
      transferId: data.transferId,
    });
  }

  sendTransferSenderConfirmedEmail(to: string, data: { transferId: string; locale?: string }) {
    void this.sendTemplatedEmail(
      to,
      "transferAwaitingConfirmation",
      this.normalizeLocale(data.locale),
      { transferId: data.transferId },
    );
  }

  sendTransferRecipientConfirmedEmail(to: string, data: { transferId: string; locale?: string }) {
    void this.sendTemplatedEmail(to, "transferConfirmed", this.normalizeLocale(data.locale), {
      transferId: data.transferId,
    });
  }

  sendTransferDadanReviewEmail(data: { transferId: string }) {
    if (this.adminEmail) {
      void this.sendTemplatedEmail(this.adminEmail, "transferDadanReview", DEFAULT_LOCALE, {
        transferId: data.transferId,
      });
    } else {
      this.logger.log(`[notifications] TRANSFER_DADAN_REVIEW - Transfer ID: ${data.transferId}`);
    }
  }

  sendTransferApprovedEmail(to: string, data: { transferId: string; locale?: string }) {
    void this.sendTemplatedEmail(to, "transferApproved", this.normalizeLocale(data.locale), {
      transferId: data.transferId,
    });
  }

  sendTransferRejectedEmail(
    to: string,
    data: { transferId: string; reason?: string; locale?: string },
  ) {
    void this.sendTemplatedEmail(
      to,
      "transferRejected",
      this.normalizeLocale(data.locale),
      { transferId: data.transferId },
      data.reason ? { key: "reason", args: { reason: data.reason } } : undefined,
    );
  }

  sendTransferCancelledEmail(to: string, data: { transferId: string; locale?: string }) {
    void this.sendTemplatedEmail(to, "transferCancelled", this.normalizeLocale(data.locale), {
      transferId: data.transferId,
    });
  }

  sendOrderPlacedEmail(to: string, data: { orderId: string; locale?: string }) {
    void this.sendTemplatedEmail(to, "orderPlaced", this.normalizeLocale(data.locale), {
      orderId: data.orderId,
    });
  }

  sendStaffCreatedEmail(
    to: string,
    data: { displayName: string; temporaryPassword: string },
  ) {
    const subject = "Your admin account has been created";
    const text = [
      `Hello ${data.displayName},`,
      "",
      "Your admin account has been created. Please log in with the temporary password below and change it immediately.",
      "",
      `Temporary Password: ${data.temporaryPassword}`,
      "",
      "You will be required to change your password on first login.",
    ].join("\n");
    const html = [
      `<h2>Welcome, ${data.displayName}</h2>`,
      "<p>Your admin account has been created. Please log in with the temporary password below and change it immediately.</p>",
      `<p><strong>Temporary Password:</strong> <code>${data.temporaryPassword}</code></p>`,
      "<p><em>You will be required to change your password on first login.</em></p>",
    ].join("");

    void this.sendEmail(to, subject, text, html);
  }
}
