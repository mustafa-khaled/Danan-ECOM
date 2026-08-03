import Container from "@/components/ui/container";
import Image from "next/image";

export function NameInspiration() {
  return (
    <section className="bg-[#F6EFED] py-12 md:py-20">
      <Container>
        {/* Title & Subtitle - Top */}
        <h2 className="font-english text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-(--color-text)">
          The Inspiration Behind Our Name
        </h2>
        <p className="mt-2 text-sm sm:text-base text-(--color-text-muted) italic">
          Tells A Story
        </p>

        {/* Content grid: Paragraphs and image aligned to the right column on desktop */}
        <div className="mt-6 md:mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Left column spacer on desktop */}
          <div className="hidden md:block" />

          {/* Right column content */}
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col gap-4 text-xs sm:text-sm md:text-base leading-relaxed text-(--color-text-muted)">
              <p>
                Dadan was one of the most significant ancient cities in the
                Arabian Peninsula. Situated along historic trade routes, it
                welcomed merchants, travelers, and craftsmen from across the
                region.
              </p>
              <p>
                Known for its prosperity and cultural exchange, Dadan became a
                place where craftsmanship, commerce, and human connection
                flourished.
              </p>
              <p>
                Today, the House of DADAN draws inspiration from that enduring
                legacy—not by recreating history, but by carrying its values into
                every piece we create.
              </p>
            </div>

            <div className="relative aspect-4/3 w-full overflow-hidden">
              <Image
                src="/assets/story/the-inspiration-behind-our-name.avif"
                alt="The Inspiration Behind Our Name"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
