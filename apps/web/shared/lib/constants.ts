import { env } from "@/env";

export function getApiBase(): string {
  if (typeof window === "undefined") {
    return process.env.API_URL ?? "http://localhost:4000";
  }
  return env.NEXT_PUBLIC_API_URL;
}

export const PAYMENT_MODE = env.NEXT_PUBLIC_PAYMENT_MODE;
export const TAP_PUBLIC_KEY = env.NEXT_PUBLIC_TAP_PUBLIC_KEY;
export const TAP_MERCHANT_ID = env.NEXT_PUBLIC_TAP_MERCHANT_ID;
export { VAT_RATE } from "./pricing";
