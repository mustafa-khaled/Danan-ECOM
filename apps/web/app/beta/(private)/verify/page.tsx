import { getTranslations } from "next-intl/server";
import { VerifyForm } from "@/components/verify-form";

export default async function VerifyPage() {
  const t = await getTranslations("verify");

  return (
    <>
      <header className="mb-10 space-y-3">
        <h1 className="font-english text-4xl text-[var(--color-text)]">{t("title")}</h1>
        <p className="max-w-2xl text-[var(--color-text-muted)]">{t("description")}</p>
      </header>

      <VerifyForm />
    </>
  );
}
