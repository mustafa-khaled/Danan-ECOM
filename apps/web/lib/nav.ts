import type { PrivateNavItem } from "@dadan/ui";

export const privateNavItems: PrivateNavItem[] = [
  { href: "/beta/home", label: "Home" },
  { href: "/beta/collections", label: "Collections" },
  { href: "/beta/wardrobe", label: "Wardrobe" },
  { href: "/beta/saved", label: "Saved" },
  { href: "/beta/cart", label: "Cart" },
  { href: "/beta/orders", label: "Orders" },
  { href: "/beta/transfers", label: "Transfers" },
  { href: "/beta/verify", label: "Verify" },
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
