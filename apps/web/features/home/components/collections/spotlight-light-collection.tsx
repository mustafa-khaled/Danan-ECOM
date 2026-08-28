import Link from "next/link";
import Image from "next/image";
import type { CollectionSummary } from "@/features/collections";
import { Container } from "@/components/ui";

export function SpotlightLightCollection({
  collection,
}: {
  collection: CollectionSummary;
}) {
  return (
    <Link
      href={`/beta/collections/${collection.slug}`}
      className="group relative flex h-full w-full items-center justify-center bg-ds-surface-warm text-left transition-colors hover:bg-ds-surface-warm-hover"
    >
      <Container className="flex h-full w-full flex-col items-center justify-center py-6 xl:py-16">
        <div className="relative mb-6 aspect-352/360 w-full lg:max-w-88 max-w-77 overflow-hidden xl:mb-8 xl:aspect-484/634 xl:max-w-121">
          <Image
            src={collection.coverImageUrl || "/assets/mawaddah.avif"}
            alt={collection.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <p className="w-full lg:max-w-88 max-w-77 text-base font-body font-semibold leading-snug text-ds-text-secondary xl:max-w-121 xl:text-lg">
          {collection.description ||
            "about the inspiration, meaning, and heritage behind the collection"}
        </p>
      </Container>
    </Link>
  );
}