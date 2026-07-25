"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { GoldDivider, LuxuryButton } from "@/components/ui";
import { useInitiateTransfer } from "@/features/transfers";

interface TransferInitiateProps {
  pieceId: string;
  pieceName: string;
  serialNumber: string;
}

export function TransferInitiate({ pieceId, pieceName, serialNumber }: TransferInitiateProps) {
  const router = useRouter();
  const t = useTranslations("transfers");
  const common = useTranslations("common");
  const wardrobeT = useTranslations("wardrobe");
  const [open, setOpen] = useState(false);
  const { initiateTransfer, isPending, error } = useInitiateTransfer();

  const TRANSFER_TYPES = [
    { value: "GIFT", label: t("gift") },
    { value: "SALE", label: t("sale") },
    { value: "INHERITANCE", label: t("inheritance") },
  ] as const;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const recipientHouseKey = String(form.get("recipientHouseKey") ?? "").trim();
    const transferType = String(form.get("transferType") ?? "GIFT") as
      | "SALE"
      | "GIFT"
      | "INHERITANCE";

    try {
      const result = await initiateTransfer({ pieceId, transferType, recipientHouseKey });
      router.push(`/beta/transfers/${result.transferId}`);
    } catch {
      /* error is rendered via the mutation's `error` state */
    }
  }

  if (!open) {
    return (
      <LuxuryButton variant="ghost" onClick={() => setOpen(true)}>
        {wardrobeT("transferOwnership")}
      </LuxuryButton>
    );
  }

  return (
    <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 className="font-display text-xl text-[var(--color-ivory)]">
        {wardrobeT("transferOwnership")}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
        {t("initiateDescription", { pieceName, serialNumber })}
      </p>
      <GoldDivider className="my-6" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
            {t("recipientHouseKey")}
          </span>
          <input
            name="recipientHouseKey"
            type="password"
            required
            autoComplete="off"
            className="min-h-11 w-full rounded-[var(--radius-item)] border border-[var(--color-border)] bg-[var(--color-void)] px-4 text-[var(--color-ivory)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
            {t("transferType")}
          </span>
          <select
            name="transferType"
            defaultValue="GIFT"
            className="min-h-11 w-full rounded-[var(--radius-item)] border border-[var(--color-border)] bg-[var(--color-void)] px-4 text-[var(--color-ivory)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          >
            {TRANSFER_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        {error ? (
          <p role="alert" className="text-sm text-[var(--color-ruby)]">
            {error instanceof Error ? error.message : t("initiateError")}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <LuxuryButton type="submit" loading={isPending}>
            {t("initiateTransfer")}
          </LuxuryButton>
          <LuxuryButton type="button" variant="ghost" onClick={() => setOpen(false)}>
            {common("cancel")}
          </LuxuryButton>
        </div>
      </form>
    </section>
  );
}
