import { Container } from "@/components/ui";
import Image from "next/image";

export function OriginStory() {
  return (
    <section className="relative w-full md:h-215.5 h-192.25 overflow-hidden bg-ds-dark-bg flex items-end pb-38.75 md:pb-37.5">
      {/* Background Image */}
      <Image
        src="/assets/story/dadan-origin-story.avif"
        alt="Every Great Story Has an Origin"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Linear Gradient Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(279.62deg, rgba(104, 104, 104, 0) -6.31%, #051B3A 117.16%)",
        }}
      />

      {/* Backdrop blur & subtle dark tint */}
      <div className="absolute inset-0 backdrop-blur-xs bg-black/40 pointer-events-none" />

      {/* Monotone noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content Container */}
      <Container className="relative text-[#FFFFFF]">
        <div className="max-w-307.25">
          <h1 className="text-h4 md:text-h1 lg:text-[64px] font-extrabold font-english">
            Every Great Story Has an Origin
          </h1>
          <p className="md:mt-5 mt-3 font-semibold text-h6 md:text-[30px] lg:text-[40px]">
            Our story begins in Dadan—an ancient city where commerce was built
            on trust, craftsmanship, and human connection. Those same values
            continue to shape every collection we create today.
          </p>
        </div>
      </Container>
    </section>
  );
}
