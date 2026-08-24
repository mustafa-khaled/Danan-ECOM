import { notFound } from "next/navigation";
import { ApiError } from "@/shared/lib/send-request";
import { fetchDesign } from "@/features/pieces";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import PieceDetails from "@/components/piece-details";

interface DesignDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DesignDetailPage({
  params,
}: DesignDetailPageProps) {
  const { slug } = await params;
  const cookie = await getSessionCookieHeader();

  let design;
  try {
    design = await fetchDesign(slug, cookie);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="w-full">
      <PieceDetails design={design} />

      {/* ── Section 2: Secondary images + Extended Story (if present) ── */}
      {/* {(design.imageUrls.length > 1 || design.story) && (
        <div className="grid lg:grid-cols-2 gap-x-10 mt-8 border-t border-gray-200 pt-8 px-6 sm:px-8 lg:px-12">
          {design.imageUrls.length > 1 && (
            <div className="grid grid-cols-2 gap-3">
              {design.imageUrls.slice(1).map((url, i) => (
                <div
                  key={i}
                  className="relative h-56 lg:h-96 w-full overflow-hidden bg-ds-surface rounded-[2px]"
                >
                  <Image
                    src={url}
                    alt={`${design.name} - ${i + 2}`}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {design.story ? (
            <section className="py-6 lg:py-0 space-y-4">
              <h2 className="font-display text-xl lg:text-2xl font-bold text-ds-text">
                {t("storyOfProtection")}
              </h2>
              <p className="font-sans text-sm sm:text-base font-medium text-ds-text">
                {t("partOfCollection", { collection: design.collection.name })}
              </p>
              <div className="space-y-3 text-sm sm:text-base leading-relaxed text-gray-600">
                {design.story.split("\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )} */}
    </div>
  );
}
