"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuxuryButton } from "@/components/ui";
import { useLogin } from "@/features/auth";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const {
    mutateAsync: login,
    isPending,
    error,
  } = useLogin();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await login({ email, password });
      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      /* error is rendered via the mutation's `error` state */
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-xs tracking-[0.14em] uppercase text-(--color-ivory-muted)"
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
          className="w-full rounded-(--radius-item) border border-border bg-(--color-surface) px-4 py-3 text-sm text-(--color-ivory) outline-none focus-visible:shadow-(--shadow-focus)"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-xs tracking-[0.14em] uppercase text-(--color-ivory-muted)"
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
          className="w-full rounded-(--radius-item) border border-border bg-(--color-surface) px-4 py-3 text-sm text-(--color-ivory) outline-none focus-visible:shadow-(--shadow-focus)"
        />
      </div>

      {error ? (
        <p className="text-sm text-(--color-ruby)" role="alert">
          {error instanceof Error ? error.message : "Sign in failed"}
        </p>
      ) : null}

      <LuxuryButton type="submit" loading={isPending} className="w-full">
        Sign in
      </LuxuryButton>
    </form>
  );
}
