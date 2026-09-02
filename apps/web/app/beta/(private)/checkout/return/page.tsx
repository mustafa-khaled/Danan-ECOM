import { getTranslations } from "next-intl/server";
import Container from "@/components/ui/container";
import { SectionHead } from "@/components/ui";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { CheckoutReturn } from "@/components/checkout-return";

interface CheckoutReturnPageProps {
  searchParams: Promise<{ tap_id?: string }>;
}

/**
 * Where Tap sends the cardholder back after 3-D Secure. The `tap_id` query
 * parameter only identifies the charge — the actual payment status is resolved
 * server-side against Tap, never trusted from the URL.
 */
export default async function CheckoutReturnPage({
  searchParams,
}: CheckoutReturnPageProps) {
  const { tap_id: tapId } = await searchParams;
  const t = await getTranslations("checkout");

  return (
    <Container className="py-4">
      <SectionHead title={t("title")} />
      {tapId ? (
        <div className="max-w-2xl">
          <CheckoutReturn tapId={tapId} />
        </div>
      ) : (
        <EmptyState
          title={t("confirmFailed")}
          description={t("confirmFailedDescription")}
          action={{ href: "/beta/cart", label: t("backToCart") }}
        />
      )}
    </Container>
  );
}
