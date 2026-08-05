import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { LoadingState } from "@/shared/components/feedback/loading-state";
import { PublicVerifyContent } from "./verify-content";

interface VerifyPageProps {
  searchParams: Promise<{ serial?: string; token?: string }>;
}

export default async function PublicVerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const t = await getTranslations("verify");

  return (
    <main className="min-h-screen bg-void">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <header className="mb-10 text-center">
          <p className="mb-3 text-xs tracking-[0.2em] uppercase text-(--color-gold)">
            DADAN
          </p>
          <h1 className="font-english text-4xl text-(--color-text)">
            {t("title")}
          </h1>
          <p className="mt-4 text-(--color-text-muted)">
            {t("description")}
          </p>
        </header>

        <Suspense fallback={<LoadingState />}>
          <PublicVerifyContent
            initialSerial={params.serial}
            initialToken={params.token}
          />
        </Suspense>

        <footer className="mt-16 text-center">
          <p className="text-xs text-(--color-text-muted)">
            © {new Date().getFullYear()} DADAN. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
