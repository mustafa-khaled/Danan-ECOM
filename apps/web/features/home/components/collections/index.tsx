import type { CollectionSummary } from "@/features/collections";
import { HeroLeftCollection } from "./hero-left-collection";
import { SpotlightLightCollection } from "./spotlight-light-collection";
import { BannerOverlayCollection } from "./banner-overlay-collection";
import { HeroCenterCollection } from "./hero-center-collection";

export * from "./hero-left-collection";
export * from "./spotlight-light-collection";
export * from "./banner-overlay-collection";
export * from "./hero-center-collection";

export default async function ExploreCollections({
  data,
}: {
  data: CollectionSummary[];
}) {
  const collections = data.slice(0, 4);

  // If no collections data, do not display the section
  if (collections.length === 0) {
    return null;
  }

  return (
    <section className="relative -mx-4 overflow-hidden sm:-mx-8 flex flex-col gap-0">
      {collections[0] && <HeroLeftCollection collection={collections[0]} />}

      {(collections[1] || collections[2]) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 lg:h-255">
          {collections[1] && (
            <SpotlightLightCollection collection={collections[1]} />
          )}

          {collections[2] && (
            <BannerOverlayCollection collection={collections[2]} />
          )}
        </div>
      )}
      {collections[3] && <HeroCenterCollection collection={collections[3]} />}
    </section>
  );
}
