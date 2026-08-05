import { ArrowLink } from "@/components/ui/ArrowLink";
import Image from "next/image";
import type { CollectionSummary } from "@/features/collections";

export function BannerOverlayCollection({
  collection,
}: {
  collection: CollectionSummary;
}) {
  return (
    <div className="relative min-h-95 sm:min-h-115 lg:min-h-140 xl:min-h-160 bg-(--color-surface) overflow-hidden group flex flex-col justify-end p-8 sm:p-12 lg:p-16">
      <Image
        src={collection.coverImageUrl || "/assets/dadan-model.avif"}
        alt={collection.name}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
      <div className="relative z-10 flex flex-col items-start">
        <h3 className="font-english text-white font-semibold text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="mt-2 max-w-md lg:max-w-lg text-white/90 text-xs sm:text-sm lg:text-base xl:text-lg leading-relaxed">
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
