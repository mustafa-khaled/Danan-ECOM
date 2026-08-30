import Link from "next/link";
import { PieceCard, SectionHead } from "@/components/ui";
import { getTranslations } from "next-intl/server";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import { fetchSelectedForYou } from "../api/fetch-selected-for-you";
import Container from "@/components/ui/container";

export default async function SelectedForYou() {
  const cookie = await getSessionCookieHeader();
  const t = await getTranslations("home");

  const selectedPieces = await fetchSelectedForYou(cookie);

  if (selectedPieces.length === 0) return null;

  return (
    <Container>
      <section className="sm:pt-[32px] sm:pb-[64px] pt-[16px] pb-5">
        <SectionHead
          title={t("selectedForYou")}
          href="/beta/pieces"
          link={t("exploreAllPieces")}
          subtitle={t("selectedForYouSubtitle")}
          className="lg:mb-12 mb-6"
          buttonClassName="sm:w-[250px]!"
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
                  imageUrl: piece.imageUrl ?? undefined,
                  imageLqip: piece.imageLqip ?? undefined,
                }}
                imageClassName="aspect-auto h-[175px] md:h-[480px] lg:h-[578px]"
                priority
                className="lg:[&_.card-cta]:justify-start lg:[&_.card-cta]:gap-[32px]"
              />
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}
