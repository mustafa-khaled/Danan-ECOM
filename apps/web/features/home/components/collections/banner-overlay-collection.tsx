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
      <div className="relative z-10 flex flex-col items-start">
        <h3 className="font-heading text-white font-semibold text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="mt-2 max-w-md lg:max-w-lg text-white/90 text-xs sm:text-sm lg:text-base xl:text-lg leading-relaxed font-body">
            {collection.description}
          </p>
        )}
        <ArrowLink
          href={`/beta/collections/${collection.slug}`}
          variant="teal"
          size="lg"
          fullWidth
          className="mt-5 lg:mt-7 max-w-xs lg:max-w-sm"
        >
          Explore Collection
        </ArrowLink>
      </div>
    </div>
  );
}
