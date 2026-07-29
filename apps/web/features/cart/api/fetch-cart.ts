import { sendRequest } from "@/shared/lib/send-request";
import type { CartResponse } from "../types";

export function fetchCart(cookieHeader?: string): Promise<CartResponse> {
  return sendRequest<CartResponse>({
    method: "GET",
    url: "/client/cart",
    cookieHeader,
  });
}
