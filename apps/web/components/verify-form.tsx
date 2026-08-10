"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, SerialBadge, StatusPill } from "@/components/ui";
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
        className={`${containerClass} space-y-4 rounded-(--radius-md) border border-ds-border bg-ds-background p-6 shadow-sm`}
      >
        <p className="text-sm text-ds-text-secondary font-body">{t("instructions")}</p>
        <Input
          label={t("serialNumber")}
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          required
          className="font-mono"
        />
        <Input
          label={t("verificationToken")}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
          className="font-mono"
        />
        {error ? (
          <p role="alert" className="text-sm text-ds-error font-body">
            {error instanceof Error ? error.message : t("verificationFailed")}
          </p>
        ) : null}
        <Button type="submit" loading={isPending} variant="primary" fullWidth={fullWidth}>
          {t("verify")}
        </Button>
      </form>

      {result ? (
        <section className={`${containerClass} rounded-(--radius-md) border border-ds-success-border bg-ds-success-bg p-6 shadow-sm`}>
          <div className="flex items-center gap-3">
            <StatusPill status="APPROVED" />
            <p className="font-heading text-xl text-ds-text">
              {String(result.pieceName ?? t("verifiedPiece"))}
            </p>
          </div>
          <div className="my-4 border-t border-ds-success-border" />
          <SerialBadge serial={String(result.serialNumber ?? serial)} />
          <dl className="mt-4 space-y-2 text-sm">
            <Row label={t("collection")} value={String(result.collection ?? "—")} />
            <Row label={t("material")} value={String(result.material ?? "—")} />
            <Row label={t("weight")} value={result.weight ? `${result.weight}g` : "—"} />
            <Row label={t("issuedAt")} value={result.issuedAt ? new Date(String(result.issuedAt)).toLocaleDateString() : "—"} />
          </dl>
          {showAuthenticityMessage ? (
            <p className="mt-4 text-xs text-ds-success-text font-body">
              {pieceT("authenticNote")}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ds-text-secondary font-body">{label}</dt>
      <dd className="font-medium text-ds-text font-body">{value}</dd>
    </div>
  );
}
