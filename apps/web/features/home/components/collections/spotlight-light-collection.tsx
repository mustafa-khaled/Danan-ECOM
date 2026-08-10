import Link from "next/link";
import Image from "next/image";
import type { CollectionSummary } from "@/features/collections";

export function SpotlightLightCollection({
  collection,
}: {
  collection: CollectionSummary;
}) {
  return (
    <Link
      href={`/beta/collections/${collection.slug}`}
      className="group relative flex flex-col items-center justify-center bg-ds-surface-warm p-6 sm:p-10 lg:p-16 min-h-95 sm:min-h-115 lg:min-h-140 xl:min-h-160 text-center transition-colors hover:bg-ds-surface-warm-hover"
    >
      {/* Product Image Box */}
      <div className="relative w-88 h-90 lg:w-121 lg:h-158.5 max-w-full mb-6 lg:mb-8 overflow-hidden opacity-100 rotate-0">
        <Image
          src={collection.coverImageUrl || "/assets/mawaddah.avif"}
          alt={collection.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <p className="max-w-xs lg:max-w-md xl:max-w-lg text-xs sm:text-sm lg:text-base xl:text-lg text-ds-text-secondary font-body font-normal leading-relaxed tracking-wide">
        {collection.description ||
          "about the inspiration, meaning, and heritage behind the collection"}
      </p>
    </Link>
  );
}
