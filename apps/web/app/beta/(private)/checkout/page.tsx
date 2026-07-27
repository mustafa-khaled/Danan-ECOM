import { getTranslations } from "next-intl/server";
import { ClientShell } from "@/components/ui";
import { CheckoutForm } from "@/components/checkout-form";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchCart } from "@/features/cart";
import {
  getSessionCookieHeader,
  requireClientSession,
} from "@/features/auth/server/session";

export default async function CheckoutPage() {
  const profile = await requireClientSession();
  const cookie = await getSessionCookieHeader();
  const items = await fetchCart(cookie);
  const t = await getTranslations("checkout");

  const validItems = items.filter((item) => item.piece);
  const total = validItems.reduce(
    (sum, item) => sum + parseFloat(item.piece!.design.basePrice),
    0,
  );
  const currency = validItems[0]?.piece?.design.currency ?? "SAR";

  return (
    <ClientShell displayName={profile.displayName}>
      <header className="mb-10 space-y-3">
        <h1 className="font-english text-4xl text-[var(--color-text)]">
          {t("title")}
        </h1>
      </header>

      {validItems.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyDescription")}
          action={{ href: "/beta/cart", label: t("title") }}
        />
      ) : (
        <div className="max-w-2xl">
          <CheckoutForm total={total} currency={currency} />
        </div>
      )}
    </ClientShell>
  );
}
