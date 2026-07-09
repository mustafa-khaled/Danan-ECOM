import { sendRequest } from "@/shared/lib/send-request";
import type { CartItem } from "../types";

export function fetchCart(cookieHeader?: string): Promise<CartItem[]> {
  return sendRequest<CartItem[]>({
    method: "GET",
    url: "/client/cart",
    cookieHeader,
  });
}
