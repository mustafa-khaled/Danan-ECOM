import Container from "@/components/ui/container";
import Image from "next/image";

export function TradeRoutes() {
  return (
    <section>
      <Container className="xl:py-49.5 md:py-20 py-12 text-neutral-800 text-center">
        <p className="font-semibold xl:text-h1 text-h2 lg:block hidden">
          For centuries, Dadan stood along one of Arabia&apos;s most important
          trade routes. Merchants traveled vast distances carrying precious
          goods, ideas, and stories. Today, DADAN continues that legacy—not by
          trading goods, but by creating pieces that carry meaning from one
          generation to the next.
        </p>

        <p className="lg:hidden font-medium">
          For centuries, Dadan stood along one of Arabia&apos;s most important
          trade routes. Merchants traveled vast distances carrying precious
          goods, ideas, and stories.
        </p>

        <p className="lg:hidden mt-5 font-medium">
          Today, DADAN continues that legacy—not by trading goods, but by
          creating pieces that carry meaning from one generation to the next.
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
