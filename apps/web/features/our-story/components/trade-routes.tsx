import Container from "@/components/ui/container";
import Image from "next/image";

export function TradeRoutes() {
  return (
    <section className="bg-white pt-12 md:pt-20 pb-0 flex flex-col gap-10 sm:gap-14 md:gap-20">
      <Container className="mx-auto max-w-4xl text-center flex flex-col gap-4 sm:gap-6 font-english text-sm sm:text-xl md:text-2xl lg:text-[1.75rem] leading-relaxed text-(--color-text)">
        <p>
          For centuries, Dadan stood along one of Arabia&apos;s most important trade
          routes. Merchants traveled vast distances carrying precious goods,
          ideas, and stories. Today, DADAN continues that legacy—not by trading
          goods, but by creating pieces that carry meaning from one generation
          to the next.
        </p>
      </Container>

      {/* Infographic Banner Image */}
      <div className="w-full">
        {/* Desktop Banner Image */}
        <Image
          src="/assets/story/story-banner.avif"
          alt="Trade, Craftsmanship, Stories and History of Dadan"
          width={1920}
          height={680}
          sizes="100vw"
          className="hidden sm:block w-full h-auto object-cover"
        />

        {/* Mobile Banner Image */}
        <Image
          src="/assets/story/story-banner-mobile.avif"
          alt="Trade, Craftsmanship, Stories and History of Dadan"
          width={750}
          height={1600}
          sizes="100vw"
          className="block sm:hidden w-full h-auto object-cover"
        />
      </div>
    </section>
  );
}
