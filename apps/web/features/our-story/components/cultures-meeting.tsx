import { Container } from "@/components/ui";
import Image from "next/image";

export function CulturesMeeting() {
  return (
    <section className="relative w-full h-151 pb-12 lg:pb-0 lg:h-228.25 overflow-hidden bg-ds-dark-bg flex flex-col justify-end lg:justify-center">
      {/* Background Image */}
      <Image
        src="/assets/story/where-cultures-stories-and-treasures-met.avif"
        alt="Where Cultures, Stories, and Treasures Met"
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
      <Container className="relative z-10 flex flex-col items-center justify-end lg:justify-center text-center">
        <h2 className="font-heading text-white font-bold text-[32px] lg:text-[64px] leading-tight drop-shadow-sm xl:whitespace-nowrap">
          Where Cultures,
          <br className="block lg:hidden" /> Stories, and Treasures
          <br className="block lg:hidden" /> Met
        </h2>
      </Container>
    </section>
  );
}
