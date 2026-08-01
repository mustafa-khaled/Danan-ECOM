import Link from "next/link";
import { PieceCard } from "@/components/ui";
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
        {/* ── Header row: title + explore button ── */}
        <div className="mb-2 flex items-start justify-between">
          <h2 className="font-english text-4xl font-bold text-(--color-text)">
            {t("selectedForYou")}
          </h2>
          <Link
            href="/beta/pieces"
            className="inline-flex items-center gap-2 bg-[#BF7266] px-5 py-2.5 text-xs font-medium tracking-[0.14em] uppercase text-white transition-colors hover:bg-[#1e3538]"
          >
            {t("exploreAllPieces")}
            <span className="rtl:rotate-180 inline-block">→</span>
          </Link>
        </div>

        {/* ── Subtitle ── */}
        <p className="mb-8 text-[24px] text-(--color-text-muted)">
          {t("selectedForYouSubtitle")}
        </p>

        {/* ── Grid: 2 cols, 3rd item spans full width ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {selectedPieces.map((piece, index) => (
            <Link
              key={piece.designSlug}
              href={`/beta/pieces/${piece.designSlug}`}
              className={index >= 2 ? "sm:col-span-2" : ""}
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
                imageClassName="aspect-auto h-[578px]"
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
