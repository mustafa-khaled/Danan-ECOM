import type { PrivateNavItem } from "@dadan/ui";

export const privateNavItems: PrivateNavItem[] = [
  { href: "/home", label: "Home" },
  { href: "/collections", label: "Collections" },
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/saved", label: "Saved" },
  { href: "/cart", label: "Cart" },
  { href: "/orders", label: "Orders" },
  { href: "/transfers", label: "Transfers" },
  { href: "/verify", label: "Verify" },
];

export function formatPrice(amount: string | number, currency = "SAR"): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTransferStatus(status: string): string {
  return status.replace(/_/g, " ");
}

export function emptyState(message: string, cta?: { href: string; label: string }) {
  return { message, cta };
}
