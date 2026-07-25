"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { GoldDivider, LuxuryButton, SerialBadge, StatusPill } from "@/components/ui";
import { useVerifySerial } from "@/features/verify";

export function VerifyForm() {
  const t = useTranslations("verify");
  const pieceT = useTranslations("piece");
  const [serial, setSerial] = useState("");
  const [token, setToken] = useState("");
  const {
    mutateAsync: verifySerial,
    data: result,
    isPending,
    error,
  } = useVerifySerial();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await verifySerial({ serial: serial.trim(), token: token.trim() });
    } catch {
      /* error is rendered via the mutation's `error` state */
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      >
        <p className="text-sm text-[var(--color-ivory-muted)]">{t("instructions")}</p>
        <label className="block">
          <span className="mb-2 block text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
            {t("serialNumber")}
          </span>
          <input
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            required
            className="min-h-11 w-full rounded-[var(--radius-item)] border border-[var(--color-border)] bg-[var(--color-void)] px-4 font-mono text-[var(--color-ivory)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
            {t("verificationToken")}
          </span>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            className="min-h-11 w-full rounded-[var(--radius-item)] border border-[var(--color-border)] bg-[var(--color-void)] px-4 font-mono text-sm text-[var(--color-ivory)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-[var(--color-ruby)]">
            {error instanceof Error ? error.message : t("verificationFailed")}
          </p>
        ) : null}
        <LuxuryButton type="submit" loading={isPending}>
          {t("verify")}
        </LuxuryButton>
      </form>

      {result ? (
        <section className="max-w-xl rounded-[var(--radius-panel)] border border-[var(--color-emerald)]/40 bg-[var(--color-surface)] p-6">
          <div className="flex items-center gap-3">
            <StatusPill status="APPROVED" />
            <p className="font-display text-xl text-[var(--color-ivory)]">
              {String(result.pieceName ?? t("verifiedPiece"))}
            </p>
          </div>
          <GoldDivider className="my-4" />
          <SerialBadge serial={String(result.serialNumber ?? serial)} />
          <dl className="mt-4 space-y-2 text-sm">
            <Row label={t("collection")} value={String(result.collection ?? "—")} />
            <Row label={t("material")} value={String(result.material ?? "—")} />
            <Row label={pieceT("weight")} value={String(result.weight ?? "—")} />
            <Row label={t("dimensions")} value={String(result.dimensions ?? "—")} />
          </dl>
        </section>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--color-border)] pb-2">
      <dt className="text-[var(--color-ivory-muted)]">{label}</dt>
      <dd className="text-[var(--color-ivory)]">{value}</dd>
    </div>
  );
}
