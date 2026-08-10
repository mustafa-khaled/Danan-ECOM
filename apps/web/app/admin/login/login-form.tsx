"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { useLogin } from "@/features/auth";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isPending, error } = useLogin();

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
      <Input
        label="Email"
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <Input
        label="Password"
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      {error ? (
        <p className="text-sm text-ds-error font-body" role="alert">
          {error instanceof Error ? error.message : "Sign in failed"}
        </p>
      ) : null}

      <Button type="submit" loading={isPending} variant="primary" fullWidth>
        Sign in
      </Button>
    </form>
  );
}
