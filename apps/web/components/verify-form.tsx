"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ShieldCheck,
  FileBadge,
  KeyRound,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button, Input, SerialBadge, StatusPill } from "@/components/ui";
import { useVerifySerial, type VerificationResult } from "@/features/verify";
import { cn } from "@/lib/utils";

interface VerifyFormProps {
  initialSerial?: string;
  initialToken?: string;
  initialResult?: VerificationResult | null;
  initialError?: string | null;
  fullWidth?: boolean;
  showAuthenticityMessage?: boolean;
  className?: string;
}

export function VerifyForm({
  initialSerial,
  initialToken,
  initialResult = null,
  initialError = null,
  fullWidth = false,
  showAuthenticityMessage = false,
  className,
}: VerifyFormProps) {
  const t = useTranslations("verify");
  const pieceT = useTranslations("piece");

  const [serial, setSerial] = useState(initialSerial ?? "");
  const [token, setToken] = useState(initialToken ?? "");

  // Server-side verification result is the initial state.
  // Manual verification replaces it.
  const [result, setResult] = useState<VerificationResult | null>(
    initialResult,
  );

  const [manualError, setManualError] = useState<string | null>(
    null,
  );

  // `initialError` describes the server-side attempt that rendered this page.
  // Once the user submits manually, only the manual attempt may be shown,
  // otherwise a successful retry keeps rendering the stale server error.
  const [submitted, setSubmitted] = useState(false);

  const {
    verifySerial,
    isPending,
  } = useVerifySerial();

  const error = submitted ? manualError : initialError;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedSerial = serial.trim();
    const normalizedToken = token.trim();

    if (!normalizedSerial || !normalizedToken) {
      return;
    }

    // Remove the previous result before starting a new verification.
    // This prevents an old certificate from remaining visible while
    // a different serial/token is being verified.
    setSubmitted(true);
    setResult(null);
    setManualError(null);

    try {
      const verificationResult = await verifySerial({
        serial: normalizedSerial,
        token: normalizedToken,
      });

      setResult(verificationResult);
    } catch (error) {
      setManualError(
        error instanceof Error
          ? error.message
          : t("verificationFailed"),
      );
    }
  }

  const containerClass = fullWidth
    ? "w-full"
    : "w-full max-w-xl mx-auto";

  return (
    <div className={cn("space-y-6", containerClass, className)}>
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-ds-border-light bg-white p-6 sm:p-8 shadow-xs transition-all"
      >
        <div>
          <h2 className="font-heading text-lg sm:text-xl text-ds-text font-normal">
            {t("instructions")}
          </h2>

          <p className="mt-1 text-xs sm:text-sm text-ds-text-secondary font-body">
            {t("description")}
          </p>
        </div>

        <div className="space-y-4 pt-1">
          <Input
            label={t("serialNumber")}
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            required
            disabled={isPending}
            placeholder="e.g. DADAN-2026-AN-000001"
            trailingIcon={
              <FileBadge className="size-4" />
            }
            className="font-mono uppercase tracking-wider placeholder:font-body placeholder:normal-case placeholder:tracking-normal"
          />

          <Input
            label={t("verificationToken")}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            disabled={isPending}
            placeholder="e.g. b0ffa752ce45e95e…"
            trailingIcon={
              <KeyRound className="size-4" />
            }
            className="font-mono tracking-wider placeholder:font-body placeholder:normal-case placeholder:tracking-normal"
          />
        </div>

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/80 p-3.5 text-sm text-ds-error font-body"
          >
            <AlertCircle className="size-4.5 shrink-0 text-ds-error mt-0.5" />

            <span className="leading-snug">
              {error}
            </span>
          </div>
        ) : null}

        <Button
          type="submit"
          loading={isPending}
          variant="primary"
          size="lg"
          fullWidth
          disabled={isPending}
          className="h-12 text-sm sm:text-base font-medium shadow-xs"
          iconLeft={
            <ShieldCheck className="size-4.5 shrink-0" />
          }
        >
          {t("verify")}
        </Button>
      </form>

      {result ? (
        <section className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-linear-to-b from-emerald-50/30 via-white to-emerald-50/20 p-6 sm:p-8 shadow-xs transition-all">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="size-5" />
              </div>

              <div>
                <p className="font-heading text-xl sm:text-2xl text-ds-text font-normal">
                  {String(
                    result.pieceName ??
                      t("verifiedPiece"),
                  )}
                </p>

                <p className="text-xs text-emerald-700 font-medium tracking-wide uppercase">
                  {t("verifiedPiece")}
                </p>
              </div>
            </div>

            <StatusPill status="APPROVED" />
          </div>

          <div className="my-5 border-t border-emerald-100" />

          <div className="flex items-center justify-between rounded-lg bg-emerald-50/60 px-4 py-2.5 border border-emerald-100">
            <span className="text-xs uppercase tracking-wider text-ds-text-secondary font-medium">
              {t("serialNumber")}
            </span>

            <SerialBadge
              serial={String(
                result.serialNumber ?? serial,
              )}
            />
          </div>

          <dl className="mt-5 space-y-3 text-sm divide-y divide-ds-border-light/60">
            <Row
              label={t("collection")}
              value={String(
                result.collection ?? "—",
              )}
            />

            <Row
              label={t("material")}
              value={String(
                result.material ?? "—",
              )}
            />

            <Row
              label={t("weight")}
              value={
                result.weight !== null &&
                result.weight !== undefined &&
                result.weight !== ""
                  ? `${result.weight}g`
                  : "—"
              }
            />

            <Row
              label={t("issuedAt")}
              value={
                result.issuedAt
                  ? new Date(
                      String(result.issuedAt),
                    ).toLocaleDateString()
                  : "—"
              }
            />
          </dl>

          {showAuthenticityMessage ? (
            <div className="mt-5 rounded-lg border border-emerald-200/50 bg-emerald-50/40 p-3.5">
              <p className="text-xs text-emerald-800 font-body leading-relaxed">
                {pieceT("authenticNote")}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between pt-2.5 first:pt-0">
      <dt className="text-ds-text-secondary font-body">
        {label}
      </dt>

      <dd className="font-medium text-ds-text font-body">
        {value}
      </dd>
    </div>
  );
}