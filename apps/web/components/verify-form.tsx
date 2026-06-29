"use client";

import { FormEvent, useState } from "react";
import { GoldDivider, LuxuryButton, SerialBadge, StatusPill } from "@dadan/ui";
import { ApiError, verifySerial } from "../lib/api";

export function VerifyForm() {
  const [serial, setSerial] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await verifySerial(serial.trim(), token.trim());
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      >
        <p className="text-sm text-[var(--color-ivory-muted)]">
          Enter the serial number and verification token from your certificate.
        </p>
        <label className="block">
          <span className="mb-2 block text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
            Serial Number
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
            Verification Token
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
            {error}
          </p>
        ) : null}
        <LuxuryButton type="submit" loading={loading}>
          Verify Authenticity
        </LuxuryButton>
      </form>

      {result ? (
        <section className="max-w-xl rounded-[var(--radius-panel)] border border-[var(--color-emerald)]/40 bg-[var(--color-surface)] p-6">
          <div className="flex items-center gap-3">
            <StatusPill status="APPROVED" />
            <p className="font-display text-xl text-[var(--color-ivory)]">
              {String(result.pieceName ?? "Verified Piece")}
            </p>
          </div>
          <GoldDivider className="my-4" />
          <SerialBadge serial={String(result.serialNumber ?? serial)} />
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Collection" value={String(result.collection ?? "—")} />
            <Row label="Material" value={String(result.material ?? "—")} />
            <Row label="Weight" value={String(result.weight ?? "—")} />
            <Row label="Dimensions" value={String(result.dimensions ?? "—")} />
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
