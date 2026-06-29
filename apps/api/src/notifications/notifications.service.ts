import { Injectable } from "@nestjs/common";

@Injectable()
export class NotificationsService {
  sendTransferInitiatedEmail(to: string, data: Record<string, unknown>) {
    console.log("[notifications] TRANSFER_INITIATED", to, data);
  }

  sendTransferSenderConfirmedEmail(to: string, data: Record<string, unknown>) {
    console.log("[notifications] TRANSFER_SENDER_CONFIRMED", to, data);
  }

  sendTransferRecipientConfirmedEmail(to: string, data: Record<string, unknown>) {
    console.log("[notifications] TRANSFER_RECIPIENT_CONFIRMED", to, data);
  }

  sendTransferDadanReviewEmail(data: Record<string, unknown>) {
    console.log("[notifications] TRANSFER_DADAN_REVIEW", data);
  }

  sendTransferApprovedEmail(to: string, data: Record<string, unknown>) {
    console.log("[notifications] TRANSFER_APPROVED", to, data);
  }

  sendTransferRejectedEmail(to: string, data: Record<string, unknown>) {
    console.log("[notifications] TRANSFER_REJECTED", to, data);
  }

  sendTransferCancelledEmail(to: string, data: Record<string, unknown>) {
    console.log("[notifications] TRANSFER_CANCELLED", to, data);
  }

  sendOrderPlacedEmail(to: string, data: Record<string, unknown>) {
    console.log("[notifications] ORDER_PLACED", to, data);
  }
}
