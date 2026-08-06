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
      className="group relative flex flex-col items-center justify-center bg-[#F6F4F0] p-6 sm:p-10 lg:p-16 min-h-95 sm:min-h-115 lg:min-h-140 xl:min-h-160 text-center transition-colors hover:bg-[#F0EDE7]"
    >
      {/* Product Image Box: Mobile (352x360), Desktop (484x634) */}
      <div className="relative w-88 h-90 lg:w-121 lg:h-158.5 max-w-full mb-6 lg:mb-8 overflow-hidden opacity-100 rotate-0">
        <Image
          src={collection.coverImageUrl || "/assets/mawaddah.avif"}
          alt={collection.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <p className="max-w-xs lg:max-w-md xl:max-w-lg text-xs sm:text-sm lg:text-base xl:text-lg text-[#3A3A3A] font-normal leading-relaxed tracking-wide">
        {collection.description ||
          "about the inspiration, meaning, and heritage behind the collection"}
      </p>
    </Link>
  );
}
