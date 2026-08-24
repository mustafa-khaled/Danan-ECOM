import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchWardrobe } from "@/features/wardrobe";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import { SectionHead } from "@/components/ui";

export default async function CertificatesPage() {
  const cookie = await getSessionCookieHeader();
  const wardrobe = await fetchWardrobe(cookie).catch(() => []);
  const t = await getTranslations("certificates");

  return (
    <>
      <SectionHead title="Certificates" />

      {wardrobe.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
          {wardrobe.map((item) => {
            const issueDate = item?.ownershipHistory?.[0]?.acquiredAt
              ? new Date(
                  item.ownershipHistory[0].acquiredAt,
                ).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })
              : null;

            return (
              <Link
                key={item.id}
                href={`/beta/profile/wardrobe/${item.id}`}
                className="group block rounded-(--radius-md) p-3 sm:p-4 bg-ds-surface-rose border border-ds-border-light transition-shadow hover:shadow-sm"
              >
                <h3 className="font-mono font-medium text-base sm:text-lg text-ds-text tracking-wide">
                  {item.serialNumber}
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm font-medium uppercase tracking-[-0.02em] text-ds-text-secondary">
                  {item.design.name}
                </p>
                {issueDate && (
                  <p className="mt-2 text-caption sm:text-xs uppercase text-ds-text-muted">
                    ISSUED {issueDate.toUpperCase()}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm sm:text-base font-medium text-ds-primary">
                    {t("view")}
                  </span>
                  <ArrowRight
                    className="w-4 h-4 sm:w-5 sm:h-5 text-ds-primary transition-transform group-hover:translate-x-1"
                    strokeWidth={1.5}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
