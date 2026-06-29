import Link from "next/link";
import { PrivateLayout } from "@dadan/ui";
import { CheckoutForm } from "../../../components/checkout-form";
import { EmptyState } from "../../../components/empty-state";
import { fetchCart } from "../../../lib/api";
import { privateNavItems } from "../../../lib/nav";
import { getSessionCookieHeader, requireClientSession } from "../../../lib/session";

export default async function CheckoutPage() {
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();
  const items = await fetchCart(cookie);

  const validItems = items.filter((item) => item.piece);
  const total = validItems.reduce(
    (sum, item) => sum + parseFloat(item.piece!.design.basePrice),
    0,
  );
  const currency = validItems[0]?.piece?.design.currency ?? "SAR";

  return (
    <PrivateLayout clientName={profile.displayName} navItems={privateNavItems}>
      <header className="mb-10 space-y-3">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--color-gold-light)]">Checkout</p>
        <h1 className="font-display text-4xl text-[var(--color-ivory)]">Complete Your Purchase</h1>
        <p className="text-[var(--color-ivory-muted)]">
          Each DADAN piece is unique. Review carefully before confirming.
        </p>
      </header>

      {validItems.length === 0 ? (
        <EmptyState
          title="Nothing to checkout"
          description="Your cart is empty. Add a piece before proceeding."
          action={{ href: "/cart", label: "View Cart" }}
        />
      ) : (
        <div className="max-w-2xl">
          <CheckoutForm total={total} currency={currency} />
          <p className="mt-6 text-center text-xs text-[var(--color-ivory-muted)]">
            <Link href="/cart" className="hover:text-[var(--color-gold-light)]">
              Return to cart
            </Link>
          </p>
        </div>
      )}
    </PrivateLayout>
  );
}
