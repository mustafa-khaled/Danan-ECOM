export const API_URL = process.env.API_URL ?? "http://localhost:4000";
export const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/backend";

export function getApiBase(): string {
  if (typeof window === "undefined") {
    return API_URL;
  }
  return NEXT_PUBLIC_API_URL;
}

export const PAYMENT_MODE = process.env.NEXT_PUBLIC_PAYMENT_MODE ?? "mock";
export const VAT_RATE = Number(process.env.NEXT_PUBLIC_VAT_RATE ?? "0.15");
