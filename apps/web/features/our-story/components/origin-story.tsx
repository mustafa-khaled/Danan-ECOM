import Image from "next/image";

export function OriginStory() {
  return (
    <section className="relative w-full min-h-[calc(100dvh-78px)] md:min-h-[calc(100dvh-115px)] overflow-hidden bg-ds-dark-bg flex flex-col justify-end">
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
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 md:px-14 lg:px-16 pt-12 pb-[18vh] sm:pb-[20vh] md:pb-[24vh] flex flex-col items-start justify-end flex-1">
        <div className="max-w-4xl">
          <h1 className="font-heading text-white font-bold text-lg sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl leading-[1.15] drop-shadow-sm whitespace-nowrap">
            Every Great Story Has an Origin
          </h1>
          <p className="mt-4 md:mt-6 text-white/90 text-sm sm:text-base md:text-lg leading-relaxed font-body font-normal">
            Our story begins in Dadan—an ancient city where commerce was built on
            trust, craftsmanship, and human connection. Those same values continue
            to shape every collection we create today.
          </p>
        </div>
      </div>
    </section>
  );
}
