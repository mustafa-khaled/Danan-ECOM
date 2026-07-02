import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly fromEmail: string;
  private readonly adminEmail: string | undefined;

  constructor(config: ConfigService) {
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

  sendTransferInitiatedEmail(to: string, data: Record<string, unknown>) {
    const transferId = data.transferId as string;
    this.sendEmail(
      to,
      "Transfer Initiated - DADAN Dijital",
      `A transfer has been initiated. Transfer ID: ${transferId}`,
      `<h2>Transfer Initiated</h2><p>A transfer has been initiated.</p><p>Transfer ID: <strong>${transferId}</strong></p>`,
    );
  }

  sendTransferSenderConfirmedEmail(to: string, data: Record<string, unknown>) {
    const transferId = data.transferId as string;
    this.sendEmail(
      to,
      "Transfer Awaiting Your Confirmation - DADAN Dijital",
      `A transfer is awaiting your confirmation. Transfer ID: ${transferId}`,
      `<h2>Transfer Awaiting Confirmation</h2><p>A transfer is awaiting your confirmation.</p><p>Transfer ID: <strong>${transferId}</strong></p>`,
    );
  }

  sendTransferRecipientConfirmedEmail(to: string, data: Record<string, unknown>) {
    const transferId = data.transferId as string;
    this.sendEmail(
      to,
      "Transfer Confirmed - DADAN Dijital",
      `The recipient has confirmed the transfer. Transfer ID: ${transferId}`,
      `<h2>Transfer Confirmed</h2><p>The recipient has confirmed the transfer.</p><p>Transfer ID: <strong>${transferId}</strong></p>`,
    );
  }

  sendTransferDadanReviewEmail(data: Record<string, unknown>) {
    const transferId = data.transferId as string;
    if (this.adminEmail) {
      this.sendEmail(
        this.adminEmail,
        "Transfer Awaiting DADAN Review - DADAN Dijital",
        `A transfer is awaiting DADAN review. Transfer ID: ${transferId}`,
        `<h2>Transfer Awaiting Review</h2><p>A transfer is awaiting DADAN review.</p><p>Transfer ID: <strong>${transferId}</strong></p>`,
      );
    } else {
      this.logger.log(`[notifications] TRANSFER_DADAN_REVIEW - Transfer ID: ${transferId}`);
    }
  }

  sendTransferApprovedEmail(to: string, data: Record<string, unknown>) {
    const transferId = data.transferId as string;
    this.sendEmail(
      to,
      "Transfer Approved - DADAN Dijital",
      `Your transfer has been approved. Transfer ID: ${transferId}`,
      `<h2>Transfer Approved</h2><p>Your transfer has been approved.</p><p>Transfer ID: <strong>${transferId}</strong></p>`,
    );
  }

  sendTransferRejectedEmail(to: string, data: Record<string, unknown>) {
    const transferId = data.transferId as string;
    const reason = data.reason as string | undefined;
    this.sendEmail(
      to,
      "Transfer Rejected - DADAN Dijital",
      `Your transfer has been rejected. Transfer ID: ${transferId}${reason ? `. Reason: ${reason}` : ""}`,
      `<h2>Transfer Rejected</h2><p>Your transfer has been rejected.</p><p>Transfer ID: <strong>${transferId}</strong></p>${reason ? `<p>Reason: ${reason}</p>` : ""}`,
    );
  }

  sendTransferCancelledEmail(to: string, data: Record<string, unknown>) {
    const transferId = data.transferId as string;
    this.sendEmail(
      to,
      "Transfer Cancelled - DADAN Dijital",
      `The transfer has been cancelled. Transfer ID: ${transferId}`,
      `<h2>Transfer Cancelled</h2><p>The transfer has been cancelled.</p><p>Transfer ID: <strong>${transferId}</strong></p>`,
    );
  }

  sendOrderPlacedEmail(to: string, data: Record<string, unknown>) {
    const orderId = data.orderId as string;
    this.sendEmail(
      to,
      "Order Confirmed - DADAN Dijital",
      `Your order has been placed successfully. Order ID: ${orderId}`,
      `<h2>Order Confirmed</h2><p>Your order has been placed successfully.</p><p>Order ID: <strong>${orderId}</strong></p>`,
    );
  }
}
