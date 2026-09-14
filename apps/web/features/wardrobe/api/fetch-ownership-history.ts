import { sendRequest } from "@/shared/lib/send-request";

export interface OwnershipHistoryEvent {
  id: string;
  pieceName: string;
  pieceId: string;
  date: string;
  type: string;
}

export function fetchOwnershipHistory(
  cookieHeader?: string,
): Promise<OwnershipHistoryEvent[]> {
  return sendRequest<OwnershipHistoryEvent[]>({
    method: "GET",
    url: "/client/wardrobe/history",
    cookieHeader,
  });
}
