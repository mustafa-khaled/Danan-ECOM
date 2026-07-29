import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { PublicVerifyContent } from "./verify-content";

interface VerifyPageProps {
  searchParams: Promise<{ serial?: string; token?: string }>;
}

export default async function PublicVerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const t = await getTranslations("verify");

  return (
    <main className="min-h-screen bg-[var(--color-void)]">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <header className="mb-10 text-center">
          <p className="mb-3 text-xs tracking-[0.2em] uppercase text-[var(--color-gold)]">
            DADAN
          </p>
          <h1 className="font-english text-4xl text-[var(--color-text)]">
            {t("title")}
          </h1>
          <p className="mt-4 text-[var(--color-text-muted)]">
            {t("description")}
          </p>
        </header>

        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-gold)] border-t-transparent" />
            </div>
          }
        >
          <PublicVerifyContent
            initialSerial={params.serial}
            initialToken={params.token}
          />
        </Suspense>

        <footer className="mt-16 text-center">
          <p className="text-xs text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} DADAN. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
