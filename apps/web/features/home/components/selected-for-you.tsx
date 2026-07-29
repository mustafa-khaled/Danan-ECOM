import Link from "next/link";
import { PieceCard } from "@/components/ui";
import { formatPrice } from "@/shared/utils/format";
import type { Locale } from "@/i18n/routing";
import { getTranslations, getLocale } from "next-intl/server";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import { fetchSelectedForYou } from "../api/fetch-selected-for-you";

export default async function SelectedForYou() {
  const locale = (await getLocale()) as Locale;
  const cookie = await getSessionCookieHeader();
  const t = await getTranslations("home");

  const selectedPieces = await fetchSelectedForYou(cookie);

  return (
    <>
      {selectedPieces.length > 0 ? (
        <section className="mb-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-english text-2xl text-(--color-text)">
              {t("selectedForYou")}
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {selectedPieces.map((piece, index) => (
              <Link key={piece.designSlug} href={`/beta/pieces/${piece.designSlug}`}>
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
                  showExplore
                  priority={index < 2}
                />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
