import { getTranslations } from "next-intl/server";
import { ClientShell } from "@/components/ui";
import { VerifyForm } from "@/components/verify-form";
import { requireClientSession } from "@/features/auth/server/session";

export default async function VerifyPage() {
  const profile = await requireClientSession();
  const t = await getTranslations("verify");

  return (
    <ClientShell displayName={profile.displayName}>
      <header className="mb-10 space-y-3">
        <h1 className="font-english text-4xl text-[var(--color-text)]">{t("title")}</h1>
        <p className="max-w-2xl text-[var(--color-text-muted)]">{t("description")}</p>
      </header>

      <VerifyForm />
    </ClientShell>
  );
}
