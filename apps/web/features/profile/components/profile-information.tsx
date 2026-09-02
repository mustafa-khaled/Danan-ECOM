import Container from "@/components/ui/container";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import { fetchProfileSummary } from "@/features/profile";

export default async function ProfileInformation() {
  const cookie = await getSessionCookieHeader().catch(() => "");
  const summary = await fetchProfileSummary(cookie).catch(() => null);

  if (!summary) {
    return null;
  }

  const t = await getTranslations("profile");

  const displayName = summary.displayName;
  const memberSinceYear = new Date(summary.memberSince)
    .getFullYear()
    .toString();
  const ownedCount = summary.ownedPiecesCount;
  const certificatesCount = summary.certificatesCount;
  const pendingTransfersCount = summary.pendingTransfersCount;

  return (
    <section className="my-6 lg:my-12">
      <Container>
        <div className="w-full bg-ds-surface-warm lg:py-12.25 lg:px-26.75 p-[16px] flex flex-col items-center justify-center text-center overflow-hidden">
          {/* User Name & Member Since */}
          <div>
            <h2 className="font-heading lg:text-h1 font-bold text-h4 lg:leading-22">
              {displayName}
            </h2>
            <p className="lg:text-h3 text-h6 font-semibold">
              {t("memberSince", { date: memberSinceYear })}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full mt-[32px]">
            <Link href="/beta/profile/wardrobe" className="lg:text-left md:text-[25px] xl:text-[32px] font-semibold text-neutral-800 text-h6">
              {t("ownedPieces", { count: ownedCount })}
            </Link>
            <Link href="/beta/profile/certificates"
              className="xl:text-[32px] md:text-[25px] font-semibold text-neutral-800 text-h6"
            >
              {t("certificatesCount", { count: certificatesCount })}
            </Link>
            <Link href="/beta/profile/transfers" className="lg:text-right md:text-[25px] xl:text-[32px] font-semibold text-neutral-800 text-h6">
              {t("pendingTransfersCount", { count: pendingTransfersCount })}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
