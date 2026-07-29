"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { GoldDivider, LuxuryButton, SerialBadge, StatusPill } from "@/components/ui";
import { useVerifySerial } from "@/features/verify";

interface VerifyFormProps {
  initialSerial?: string;
  initialToken?: string;
  autoVerify?: boolean;
  fullWidth?: boolean;
  showAuthenticityMessage?: boolean;
}

export function VerifyForm({
  initialSerial,
  initialToken,
  autoVerify = false,
  fullWidth = false,
  showAuthenticityMessage = false,
}: VerifyFormProps) {
  const t = useTranslations("verify");
  const pieceT = useTranslations("piece");

  const [serial, setSerial] = useState(initialSerial ?? "");
  const [token, setToken] = useState(initialToken ?? "");
  const autoVerifiedRef = useRef(false);

  const { verifySerial, data: result, isPending, error } = useVerifySerial();

  useEffect(() => {
    if (autoVerify && initialSerial && initialToken && !autoVerifiedRef.current) {
      autoVerifiedRef.current = true;
      void verifySerial({ serial: initialSerial, token: initialToken });
    }
  }, [autoVerify, initialSerial, initialToken, verifySerial]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await verifySerial({ serial: serial.trim(), token: token.trim() });
    } catch {
      // error is rendered via the mutation's `error` state
    }
  }

  const containerClass = fullWidth ? "" : "max-w-xl";

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className={`${containerClass} space-y-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6`}
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
        <LuxuryButton type="submit" loading={isPending} className={fullWidth ? "w-full" : ""}>
          {t("verify")}
        </LuxuryButton>
      </form>

      {result ? (
        <section className={`${containerClass} rounded-[var(--radius-panel)] border border-[var(--color-emerald)]/40 bg-[var(--color-surface)] p-6`}>
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

          {showAuthenticityMessage && (
            <div className="mt-6 rounded-[var(--radius-sm)] bg-[var(--color-emerald)]/10 p-4">
              <p className="text-center text-sm text-[var(--color-emerald)]">
                ✓ This piece has been verified as an authentic DADAN piece.
              </p>
            </div>
          )}
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
