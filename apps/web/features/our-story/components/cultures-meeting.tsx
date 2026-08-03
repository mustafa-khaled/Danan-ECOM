import Image from "next/image";

export function CulturesMeeting() {
  return (
    <section className="relative w-full h-151 md:h-228.25 overflow-hidden bg-black flex flex-col justify-end md:justify-center">
      {/* Background Image */}
      <Image
        src="/assets/story/where-cultures-stories-and-treasures-met.avif"
        alt="Where Cultures, Stories, and Treasures Met"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Blue / Gray Linear Gradient Overlay */}
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

      {/* Content Container: Centered on desktop & tablet, bottom 35% on mobile */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-12 pb-35 md:py-16 lg:py-24 flex flex-col items-center justify-end md:justify-center text-center">
        <h2 className="font-english text-white font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-tight drop-shadow-sm md:whitespace-nowrap">
          Where Cultures,<br className="block md:hidden" /> Stories, and Treasures<br className="block md:hidden" /> Met
        </h2>
      </div>
    </section>
  );
}
