import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { WardrobeLayout } from "@/components/ui";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchWardrobe } from "@/features/wardrobe";
import { fetchTransfers } from "@/features/transfers";
import { getSessionCookieHeader } from "@/features/auth/server/session";

export default async function CertificatesPage() {
  const cookie = await getSessionCookieHeader();
  const [wardrobe, transfers] = await Promise.all([
    fetchWardrobe(cookie),
    fetchTransfers(cookie),
  ]);
  const t = await getTranslations("certificates");

  const pendingTransfers = transfers.filter((tr) => tr.status === "PENDING").length;

  return (
    <>
      <WardrobeLayout
        ownedCount={wardrobe.length}
        certificatesCount={wardrobe.length}
        pendingTransfers={pendingTransfers}
      >
        {wardrobe.length === 0 ? (
          <EmptyState title={t("empty")} description={t("emptyDescription")} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {wardrobe.map((item, index) => (
              <div
                key={item.id}
                className="border border-[var(--color-border)] bg-white p-6"
              >
                <p className="text-xs tracking-[0.14em] uppercase text-[var(--color-text-muted)]">
                  CERTIFICATE #{String(index + 1).padStart(3, "0")}
                </p>
                <h3 className="mt-2 font-english text-lg text-[var(--color-text)]">
                  {item.design.name}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  {item.serialNumber}
                </p>
                <Link
                  href={`/beta/wardrobe/${item.id}`}
                  className="mt-4 inline-block text-xs tracking-[0.12em] uppercase text-[var(--color-accent)] hover:underline"
                >
                  {t("view")}
                </Link>
              </div>
            ))}
          </div>
        )}
      </WardrobeLayout>
    </>
  );
}
