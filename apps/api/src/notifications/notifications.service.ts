import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { I18nService } from "nestjs-i18n";
import type { Locale } from "@dadan/types";
import * as nodemailer from "nodemailer";
import { DEFAULT_LOCALE, isLocale } from "../common/i18n/locale";

interface EmailContent {
  subject: string;
  heading: string;
  body: string;
  extraLine?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly fromEmail: string;
  private readonly adminEmail: string | undefined;

  constructor(
    private readonly i18n: I18nService,
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
}
