import { sendRequest } from "@/shared/lib/send-request";
import type { SelectedPiece } from "../types";

export function fetchSelectedForYou(cookieHeader?: string): Promise<SelectedPiece[]> {
  return sendRequest<SelectedPiece[]>({
    method: "GET",
    url: "/client/home/selected-pieces",
    cookieHeader,
  });
}
