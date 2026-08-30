import { ArrowLink } from "@/components/ui/ArrowLink";
import Image from "next/image";
import type { CollectionSummary } from "@/features/collections";

export function BannerOverlayCollection({
  collection,
}: {
  collection: CollectionSummary;
}) {
  return (
    <div className="relative h-109 lg:h-auto bg-ds-surface overflow-hidden group flex flex-col justify-end p-8 sm:p-12 lg:p-16">
      <Image
        src={collection.coverImageUrl || "/assets/dadan-model.avif"}
        alt={collection.name}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Linear Gradient Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(279.62deg, rgba(104, 104, 104, 0) -6.31%, rgba(5, 27, 58, 0.72) 117.16%)",
        }}
      />

      {/* Backdrop blur & subtle dark tint */}
      <div className="absolute inset-0 backdrop-blur-xs bg-black/5 pointer-events-none" />

      {/* Monotone noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Text & action content */}
      <div className="relative z-10 flex flex-col items-start text-white font-semibold">
        <h3 className="font-heading lg:leading-22 leading-[100%] lg:text-h1 text-h4">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="lg:text-[32px] text-h6 mt-[16px] mb-6">
            {collection.description}
          </p>
        )}
        <ArrowLink
          href={`/beta/collections/${collection.slug}`}
          variant="teal"
          size="lg"
          fullWidth
          className="text-neutral-950! lg:text-h4 text-h5 lg:max-w-94.75 max-w-56.75 whitespace-nowrap p-3!"
        >
          Explore Collection
        </ArrowLink>
      </div>
    </div>
  );
}
