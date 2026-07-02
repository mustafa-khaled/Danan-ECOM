import Link from "next/link";
import { GoldDivider, PrivateLayout, SerialBadge } from "@dadan/ui";
import { CartItemActions } from "../../../../components/cart-item-actions";
import { EmptyState } from "../../../../components/empty-state";
import { fetchCart } from "../../../../lib/api";
import { formatPrice, privateNavItems } from "../../../../lib/nav";
import { getSessionCookieHeader, requireClientSession } from "../../../../lib/session";

export default async function CartPage() {
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();
  const items = await fetchCart(cookie);

  const validItems = items.filter((item) => item.piece);
  const subtotal = validItems.reduce(
    (sum, item) => sum + parseFloat(item.piece!.design.basePrice),
    0,
  );
  const currency = validItems[0]?.piece?.design.currency ?? "SAR";
  const vat = subtotal * 0.15;
  const total = subtotal + vat;

  return (
    <PrivateLayout clientName={profile.displayName} navItems={privateNavItems}>
      <header className="mb-10 space-y-3">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--color-gold-light)]">Reserved</p>
        <h1 className="font-display text-4xl text-[var(--color-ivory)]">Your Cart</h1>
        <p className="text-[var(--color-ivory-muted)]">
          Pieces are held for 30 minutes while you complete checkout.
        </p>
      </header>

      {validItems.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Browse collections to discover available pieces."
          action={{ href: "/beta/collections", label: "Explore Collections" }}
        />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <ul className="space-y-4">
            {validItems.map((item) => {
              const piece = item.piece!;
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-row sm:items-center"
                >
                  <div className="h-24 w-20 shrink-0 overflow-hidden rounded-[var(--radius-item)] bg-[var(--color-void)]">
                    {piece.design.imageUrls[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={piece.design.imageUrls[0]}
                        alt={piece.design.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
                      {piece.design.collection.name}
                    </p>
                    <h2 className="font-display text-xl text-[var(--color-ivory)]">
                      {piece.design.name}
                    </h2>
                    <div className="mt-2">
                      <SerialBadge serial={piece.serialNumber} />
                    </div>
                    <p className="mt-2 text-xs text-[var(--color-ivory-muted)]">
                      Reserved until {new Date(item.expiresAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-display text-lg text-[var(--color-gold-light)]">
                      {formatPrice(piece.design.basePrice, piece.design.currency)}
                    </p>
                    <CartItemActions pieceId={piece.id} />
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="font-display text-xl text-[var(--color-ivory)]">Order Summary</h2>
            <GoldDivider className="my-4" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-ivory-muted)]">Subtotal</dt>
                <dd>{formatPrice(subtotal, currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ivory-muted)]">VAT (15%)</dt>
                <dd>{formatPrice(vat, currency)}</dd>
              </div>
              <div className="flex justify-between font-display text-lg text-[var(--color-gold-light)]">
                <dt>Total</dt>
                <dd>{formatPrice(total, currency)}</dd>
              </div>
            </dl>
            <Link
              href="/beta/checkout"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-button)] border border-[var(--color-gold)] bg-transparent text-sm tracking-[0.1em] uppercase text-[var(--color-gold)] transition-colors hover:bg-[var(--color-gold)] hover:text-[var(--color-void)]"
            >
              Proceed to Checkout
            </Link>
          </aside>
        </div>
      )}
    </PrivateLayout>
  );
}
