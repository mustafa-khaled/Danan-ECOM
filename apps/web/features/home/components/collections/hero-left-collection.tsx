// import { ArrowLink } from "@/components/ui/ArrowLink";
// import Image from "next/image";
// import type { CollectionSummary } from "@/features/collections";

// export function HeroLeftCollection({
//   collection,
// }: {
//   collection: CollectionSummary;
// }) {
//   return (
//     <div className="relative h-159 lg:h-256 bg-(--color-surface) overflow-hidden group">
//       <Image
//         src={collection.coverImageUrl || "/assets/mawaddah.avif"}
//         alt={collection.name}
//         fill
//         sizes="100vw"
//         className="object-cover transition-transform duration-700 group-hover:scale-105"
//       />

//       {/* Warm gradient overlay */}
//       <div
//         className="absolute inset-0"
//         style={{
//           background:
//             "linear-gradient(75.28deg, rgba(175, 97, 73, 0.85) 1.63%, rgba(65, 149, 155, 0) 75.41%)",
//         }}
//       />

//       {/* Text content */}
//       <div className="absolute w-full max-w-89.5 md:max-w-258.75 md:md:bottom-49.25 md:left-[64px] bottom-13.25 left-[50%] translate-x-[-50%] md:translate-x-[0%] flex flex-col justify-end">
//         <h2 className="font-english text-white font-bold text-h4 sm:text-4xl md:text-5xl lg:text-[85px] drop-shadow-sm">
//           {collection.name}
//         </h2>

//         {collection.description && (
//           <p className="text-white/95 font-medium text-base sm:text-xl md:text-2xl lg:text-[32px] leading-relaxed md:mt-6 md:mb-[32px] mt-3 mb-5">
//             {collection.description}
//           </p>
//         )}

//         <ArrowLink
//           href={`/beta/collections/${collection.slug}`}
//           variant="teal"
//           size="lg"
//           fullWidth
//           className="max-w-xs sm:max-w-md lg:max-w-lg"
//         >
//           Explore Your Experience
//         </ArrowLink>
//       </div>
//     </div>
//   );
// }

import { ArrowLink } from "@/components/ui/ArrowLink";
import Image from "next/image";
import type { CollectionSummary } from "@/features/collections";
import { Container } from "@/components/ui";

export function HeroLeftCollection({
  collection,
}: {
  collection: CollectionSummary;
}) {
  return (
    <div className="relative h-159 lg:h-256 bg-(--color-surface) overflow-hidden group">
      <Image
        src={collection.coverImageUrl || "/assets/mawaddah.avif"}
        alt={collection.name}
        fill
        sizes="100vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Warm gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(75.28deg, rgba(175, 97, 73, 0.85) 1.63%, rgba(65, 149, 155, 0) 75.41%)",
        }}
      />

      {/* Text content */}
      <Container className="relative z-10 h-full flex flex-col justify-end items-center md:items-start pb-13.25 md:pb-49.25 px-3.75 md:px-16 2xl:px-0">
        <div className="w-full max-w-89.5 md:max-w-258.75 flex flex-col">
          <h2 className="font-english text-white font-bold text-h4 sm:text-4xl md:text-5xl lg:text-[85px] drop-shadow-sm">
            {collection.name}
          </h2>

          {collection.description && (
            <p className="text-white/95 font-medium text-base sm:text-xl md:text-2xl lg:text-[32px] leading-relaxed md:mt-6 md:mb-[32px] mt-3 mb-5">
              {collection.description}
            </p>
          )}

          <ArrowLink
            href={`/beta/collections/${collection.slug}`}
            variant="teal"
            size="lg"
            fullWidth
            className="max-w-xs sm:max-w-md lg:max-w-lg"
          >
            Explore Your Experience
          </ArrowLink>
        </div>
      </Container>
    </div>
  );
}
