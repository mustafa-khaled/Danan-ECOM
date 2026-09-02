import { getTranslations } from "next-intl/server";
import Container from "@/components/ui/container";
import Image from "next/image";

export async function TradeRoutes() {
  const t = await getTranslations("ourStory");

  return (
    <section>
      <Container className="xl:py-49.5 md:py-20 py-12 text-neutral-800 text-center">
        <p className="font-semibold xl:text-h1 text-h2 lg:block hidden">
          {t("tradeRoutesPara")}
        </p>

        <p className="lg:hidden font-medium">
          {t("tradeRoutesPara")}
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
