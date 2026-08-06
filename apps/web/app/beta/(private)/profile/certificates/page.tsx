import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
      <SectionHead
        title="Certificates"
        subtitle="Digital certificates of authenticity for your owned pieces"
      />

      {wardrobe.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wardrobe.map((item, index) => (
            <div
              key={item.id}
              className="border border-border bg-white p-6"
            >
              <p className="text-xs tracking-[0.14em] uppercase text-(--color-text-muted)">
                CERTIFICATE #{String(index + 1).padStart(3, "0")}
              </p>
              <h3 className="mt-2 font-english text-lg text-(--color-text)">
                {item.design.name}
              </h3>
              <p className="mt-2 text-sm text-(--color-text-muted)">
                {item.serialNumber}
              </p>
              <Link
                href={`/beta/profile/wardrobe/${item.id}`}
                className="mt-4 inline-block text-xs tracking-[0.12em] uppercase text-[#BC776E] hover:underline"
              >
                {t("view")}
              </Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
