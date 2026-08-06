export interface NavItem {
  href: string;
  labelKey: "stories" | "collections" | "wardrobe" | "verify";
}

export const primaryNavItems: NavItem[] = [
  { href: "/beta/our-story", labelKey: "stories" },
  { href: "/beta/collections", labelKey: "collections" },
  { href: "/beta/profile/wardrobe", labelKey: "wardrobe" },
  { href: "/beta/verify", labelKey: "verify" },
];

export const secondaryNavItems = [
  { href: "/beta/saved", labelKey: "saved" as const },
  { href: "/beta/cart", labelKey: "cart" as const },
  { href: "/beta/orders", labelKey: "orders" as const },
  { href: "/beta/profile", labelKey: "profile" as const },
];
