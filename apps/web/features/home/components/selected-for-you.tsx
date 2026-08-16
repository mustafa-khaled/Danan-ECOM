import Link from "next/link";
import { PieceCard, SectionHead } from "@/components/ui";
import { formatPrice } from "@/shared/utils/format";
import type { Locale } from "@/i18n/routing";
import { getTranslations, getLocale } from "next-intl/server";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import { fetchSelectedForYou } from "../api/fetch-selected-for-you";
import Container from "@/components/ui/container";

export default async function SelectedForYou() {
  const locale = (await getLocale()) as Locale;
  const cookie = await getSessionCookieHeader();
  const t = await getTranslations("home");

  const selectedPieces = await fetchSelectedForYou(cookie);

  if (selectedPieces.length === 0) return null;

  return (
    <Container>
      <section className="py-16">
        <SectionHead
          title={t("selectedForYou")}
          href="/beta/pieces"
          link={t("exploreAllPieces")}
          subtitle={t("selectedForYouSubtitle")}
        />

        {/* ── Grid: 2 cols, 3rd item spans full width ── */}
        <div className="grid grid-cols-2 gap-2 sm:gap-6">
          {selectedPieces.map((piece, index) => (
            <Link
              key={piece.designSlug}
              href={`/beta/pieces/${piece.designSlug}`}
              className={index >= 2 ? "col-span-2" : ""}
            >
              <PieceCard
                piece={{
                  id: piece.designSlug,
                  name: piece.name,
                  serialNumber: piece.designSlug,
                  imageUrl: piece.imageUrl ?? undefined,
                  imageLqip: piece.imageLqip ?? undefined,
                  collectionName: piece.collectionName,
                  price: piece.basePrice
                    ? formatPrice(piece.basePrice, piece.currency, locale)
                    : undefined,
                }}
                imageClassName="aspect-auto h-[175px] md:h-[480px] lg:h-[578px]"
                className="h-69.5 sm:h-auto"
                showExplore
                priority
              />
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}
