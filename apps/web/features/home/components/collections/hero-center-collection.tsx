import { ArrowLink } from "@/components/ui/ArrowLink";
import Image from "next/image";
import type { CollectionSummary } from "@/features/collections";

export function HeroCenterCollection({
  collection,
}: {
  collection: CollectionSummary;
}) {
  return (
    <div className="relative h-200.5 lg:h-255 bg-(--color-surface) overflow-hidden group">
      <Image
        src={collection.coverImageUrl || "/assets/mawaddah.avif"}
        alt={collection.name}
        fill
        sizes="100vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/30 sm:bg-black/20" />
      <div className="absolute md:bottom-25 bottom-19 left-[50%] translate-x-[-50%] flex flex-col sm:items-center justify-end w-full max-w-89.5 md:max-w-258.75 sm:text-center">
        <h2 className="font-english text-white text-h4 lg:text-[56px] font-bold drop-shadow-sm">
          {collection.name}
        </h2>
        {collection.description && (
          <p className="text-white/95 mt-3 mb-5 lg:mt-6 lg:mb-[32px] font-medium text-h6 lg:text-[32px] leading-[100%] sm:text-center">
            {collection.description}
          </p>
        )}
        <ArrowLink
          href={`/beta/collections/${collection.slug}`}
          variant="teal"
          size="lg"
          fullWidth
          className="lg:w-89.5 text-neutral-950 max-w-78"
        >
          Explore Your Experience
        </ArrowLink>
      </div>
    </div>
  );
}
