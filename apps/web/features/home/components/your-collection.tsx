import Link from "next/link";
import Container from "@/components/ui/container";
import { PieceCard } from "@/components/ui/PieceCard";
import { getTranslations } from "next-intl/server";
import { fetchWardrobe, type WardrobePiece } from "@/features/wardrobe";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import { SectionHead } from "@/components/ui";
import { CollectionCarousel } from "./collection-carousel";

interface DisplayPiece {
  id: string;
  name: string;
  imageUrl: string;
  ownedSince: string;
  href: string;
}

function formatAcquiredDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d
        .toLocaleDateString("en-US", { month: "long", year: "numeric" })
        .toUpperCase();
    }
  } catch {
    // Fallback empty
  }
  return "";
}

export default async function YourCollection() {
  const cookie = await getSessionCookieHeader();
  const t = await getTranslations("home");

  let wardrobe: WardrobePiece[] = [];
  try {
    wardrobe = await fetchWardrobe(cookie, { limit: 3 });
  } catch {
    wardrobe = [];
  }

  if (!wardrobe || wardrobe.length === 0) {
    return null;
  }

  const items: DisplayPiece[] = wardrobe.map((item) => ({
    id: item.id,
    name: item.design?.name || "",
    imageUrl: item.design?.images?.[0] || "",
    ownedSince: formatAcquiredDate(item.acquiredAt),
    href: `/beta/profile/wardrobe/${item.id}`,
  }));

  return (
    <Container>
      <section className="py-12 sm:py-16">
        <SectionHead
          title={t("yourCollection")}
          href="/beta/profile/wardrobe"
          link={t("exploreAll")}
          subtitle={t("yourCollectionSubtitle")}
        />

        {/* ── Mobile Carousel ── */}
        <CollectionCarousel
          items={items}
          ownedSinceLabel={t("ownedSince")}
        />

        {/* ── Desktop Grid ── */}
        <div className="hidden md:grid grid-cols-3 gap-6 lg:gap-8">
          {items.map((piece) => (
            <Link key={piece.id} href={piece.href} className="block">
              <PieceCard
                piece={{
                  id: piece.id,
                  name: piece.name,
                  subtitle: piece.ownedSince
                    ? `${t("ownedSince")}: ${piece.ownedSince}`
                    : undefined,
                  imageUrl: piece.imageUrl,
                }}
                showExplore
              />
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}

