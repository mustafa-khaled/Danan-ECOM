import { sendRequest } from "@/shared/lib/send-request";

export function initiateTransfer(body: {
  pieceId: string;
  transferType: "SALE" | "GIFT" | "INHERITANCE";
  recipientHouseKey: string;
}): Promise<{ transferId: string; status: string; piece: { id: string; serialNumber: string; name: string; image?: string | null }; recipientDisplayName: string }> {
  return sendRequest({
    method: "POST",
    url: "/client/transfers/initiate",
    body,
  });
}
