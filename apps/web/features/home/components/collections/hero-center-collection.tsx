import { ArrowLink } from "@/components/ui/ArrowLink";
import Image from "next/image";
import type { CollectionSummary } from "@/features/collections";

export function HeroCenterCollection({
  collection,
}: {
  collection: CollectionSummary;
}) {
  return (
    <div className="relative aspect-video sm:aspect-16/7 lg:aspect-16/6 min-h-105 sm:min-h-125 lg:min-h-150 xl:min-h-170 bg-(--color-surface) overflow-hidden group">
      <Image
        src={collection.coverImageUrl || "/assets/mawaddah.png"}
        alt={collection.name}
        fill
        sizes="100vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/30 sm:bg-black/20" />
      <div className="absolute inset-0 flex flex-col items-center justify-end p-6 sm:p-10 md:p-14 lg:p-20 xl:p-28 text-center">
        <h2 className="font-english text-white font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl drop-shadow-sm">
          {collection.name}
        </h2>
        {collection.description && (
          <p className="mt-3 max-w-xl lg:max-w-3xl xl:max-w-4xl text-white/95 font-medium text-base sm:text-xl md:text-2xl lg:text-3xl leading-relaxed text-center">
            {collection.description}
          </p>
        )}
        <ArrowLink
          href={`/beta/collections/${collection.slug}`}
          variant="teal"
          size="lg"
          fullWidth
          className="mt-6 lg:mt-8 max-w-xs sm:max-w-md lg:max-w-lg"
        >
          Explore Your Experience
        </ArrowLink>
      </div>
    </div>
  );
}
