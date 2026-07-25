import { env } from "@/env";

export const VAT_RATE = env.VAT_RATE;

export function calculateVat(subtotal: number): number {
  return subtotal * VAT_RATE;
}

export function calculateTotal(subtotal: number): number {
  return subtotal + calculateVat(subtotal);
}
