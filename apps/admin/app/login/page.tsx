import { redirect } from "next/navigation";
import { GoldDivider } from "@dadan/ui";
import { getAdminSession } from "../../lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--color-void)] px-4 py-12">
      <div className="w-full max-w-md border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
        <div className="mb-6 text-center">
          <p className="font-display text-2xl tracking-[0.08em] uppercase">DADAN Admin</p>
          <p className="mt-2 text-xs tracking-[0.14em] uppercase text-[var(--color-ivory-muted)]">
            Staff sign in
          </p>
        </div>
        <GoldDivider />
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
