import { sendRequest } from "@/shared/lib/send-request";

export interface ReserveResponse {
  reserved: boolean;
  expiresAt: string;
}

export function reserveForCheckout(): Promise<ReserveResponse> {
  return sendRequest<ReserveResponse>({
    method: "POST",
    url: "/client/checkout/reserve",
  });
}
