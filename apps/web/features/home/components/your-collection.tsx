import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import Container from "@/components/ui/container";
import { fetchWardrobe, type WardrobePiece } from "@/features/wardrobe";
import { getSessionCookieHeader } from "@/features/auth/server/session";

interface DisplayPiece {
  id: string;
  name: string;
  imageUrl: string;
  ownedSince: string;
  href: string;
}

export default async function YourCollection() {
  const cookie = await getSessionCookieHeader();
  const t = await getTranslations("home");

  let wardrobe: WardrobePiece[] = [];
  try {
    wardrobe = await fetchWardrobe(cookie);
  } catch {
    wardrobe = [];
  }

  if (!wardrobe || wardrobe.length === 0) {
    return null;
  }

  const items: DisplayPiece[] = wardrobe.slice(0, 3).map((item) => {
    const acquiredDate = item.ownershipHistory?.[0]?.acquiredAt;
    let formattedDate = "";
    if (acquiredDate) {
      try {
        const d = new Date(acquiredDate);
        if (!isNaN(d.getTime())) {
          formattedDate = d
            .toLocaleDateString("en-US", { month: "long", year: "numeric" })
            .toUpperCase();
        }
      } catch {
        // Fallback empty
      }
    }

    return {
      id: item.id,
      name: item.design?.name || "",
      imageUrl: item.design?.images?.[0] || "",
      ownedSince: formattedDate,
      href: `/beta/wardrobe/${item.id}`,
    };
  });

  return (
    <Container>
      <section className="py-12 sm:py-16">
        {/* ── Section Header ── */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-english text-3xl font-bold tracking-tight text-(--color-text) sm:text-4xl">
              {t("yourCollection")}
            </h2>
            <p className="mt-2 text-sm text-(--color-text-muted) sm:text-base">
              {t("yourCollectionSubtitle")}
            </p>
          </div>
          <Link
            href="/beta/wardrobe"
            className="inline-flex items-center justify-center gap-2 self-start bg-[#B56B5D] px-5 py-2.5 text-xs font-medium tracking-wide text-white transition-colors hover:bg-[#a05c50] sm:self-auto"
          >
            <span>{t("exploreAll")}</span>
            <span className="rtl:rotate-180 inline-block">→</span>
          </Link>
        </div>

        {/* ── Pieces Grid ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
          {items.map((piece) => (
            <Link key={piece.id} href={piece.href} className="group block">
              {/* Image container */}
              <div className="relative aspect-square w-full overflow-hidden bg-[#F5F3EF]">
                {piece.imageUrl ? (
                  <Image
                    src={piece.imageUrl}
                    alt={piece.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
              </div>

              {/* Card Meta Content */}
              <div className="pt-4 pb-2 flex flex-col gap-1">
                <h3 className="text-xs sm:text-sm font-semibold tracking-wider text-[#222222] uppercase">
                  {piece.name}
                </h3>
                {piece.ownedSince ? (
                  <p className="text-[10px] sm:text-xs text-[#737373] font-medium tracking-wider uppercase">
                    {t("ownedSince")}: {piece.ownedSince}
                  </p>
                ) : null}
                <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#2D6A5D] transition-colors group-hover:text-[#205347]">
                  <span>{t("explorePiece")}</span>
                  <span className="inline-block transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}
