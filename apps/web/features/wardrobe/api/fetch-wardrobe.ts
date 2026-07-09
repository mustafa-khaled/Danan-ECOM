import { sendRequest } from "@/shared/lib/send-request";
import type { WardrobePiece } from "../types";

export function fetchWardrobe(cookieHeader?: string): Promise<WardrobePiece[]> {
  return sendRequest<WardrobePiece[]>({
    method: "GET",
    url: "/client/wardrobe",
    cookieHeader,
  });
}
