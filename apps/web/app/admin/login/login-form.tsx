"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuxuryButton } from "@dadan/ui";
import { adminLogin } from "../../../lib/api/admin";
import { ApiError } from "../../../lib/api/shared";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await adminLogin(email, password);
      router.replace("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-xs tracking-[0.14em] uppercase text-[var(--color-ivory-muted)]"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-[var(--radius-item)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ivory)] outline-none focus-visible:shadow-[var(--shadow-focus)]"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-xs tracking-[0.14em] uppercase text-[var(--color-ivory-muted)]"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-[var(--radius-item)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ivory)] outline-none focus-visible:shadow-[var(--shadow-focus)]"
        />
      </div>

      {error ? (
        <p className="text-sm text-[var(--color-ruby)]" role="alert">
          {error}
        </p>
      ) : null}

      <LuxuryButton type="submit" loading={loading} className="w-full">
        Sign in
      </LuxuryButton>
    </form>
  );
}
