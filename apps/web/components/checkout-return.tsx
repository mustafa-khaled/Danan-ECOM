"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { LoadingState } from "@/shared/components/feedback/loading-state";
import { useConfirmCheckout } from "@/features/checkout";

interface CheckoutReturnProps {
  tapId: string;
}

export function CheckoutReturn({ tapId }: CheckoutReturnProps) {
  const router = useRouter();
  const t = useTranslations("checkout");
  const { confirmCheckout, data, isPending, error } = useConfirmCheckout();
  const hasRun = useRef(false);

  useEffect(() => {
    // Guarded because React strict mode mounts effects twice in development,
    // and confirming is a state-changing call.
    if (hasRun.current) return;
    hasRun.current = true;

    void confirmCheckout(tapId)
      .then((result) => {
        if (result.status === "paid") {
          router.replace(`/beta/orders/${result.orderId}`);
        }
      })
      .catch(() => {
        /* surfaced through the mutation's `error` state */
      });
  }, [confirmCheckout, router, tapId]);

  if (isPending || data?.status === "paid") {
    return <LoadingState label={t("confirming")} />;
  }

  // Tap accepted the card but has not settled yet; the webhook will finish it.
  if (data?.status === "pending") {
    return (
      <div className="rounded-(--radius-md) border border-ds-border bg-ds-background p-6 text-center shadow-sm">
        <h2 className="font-heading text-xl text-ds-text">{t("confirmPending")}</h2>
        <p className="mt-3 text-sm text-ds-text-secondary">
          {t("confirmPendingDescription")}
        </p>
        <div className="mt-6">
          <Link href={`/beta/orders/${data.orderId}`}>
            <Button variant="primary">{t("viewOrder")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-(--radius-md) border border-ds-border bg-ds-background p-6 text-center shadow-sm">
      <h2 className="font-heading text-xl text-ds-text">{t("confirmFailed")}</h2>
      <p role="alert" className="mt-3 text-sm text-ds-error">
        {error instanceof Error ? error.message : t("confirmFailedDescription")}
      </p>
      <div className="mt-6">
        <Link href="/beta/cart">
          <Button variant="primary">{t("backToCart")}</Button>
        </Link>
      </div>
    </div>
  );
}
