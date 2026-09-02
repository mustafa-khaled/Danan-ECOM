import { getTranslations } from "next-intl/server";
import Container from "@/components/ui/container";
import Image from "next/image";

export async function PieceStory() {
  const t = await getTranslations("ourStory");

  return (
    <section className="py-[32px] lg:py-12">
      <Container className="flex flex-col text-neutral-900">
        <h2 className="font-heading lg:text-[40px] text-h4 font-extrabold">
          {t("pieceStoryTitle")}
        </h2>

        <p className="lg:text-[32px] text-[14px] mt-6.5 mb-6 lg:mt-14.5 font-semibold lg:font-bold leading-[130%]">
          {t("pieceStoryLine1")}
          <br />
          {t("pieceStoryLine2")}
          <br />
          {t("pieceStoryLine3")}
        </p>

        <div className="relative w-full h-181.75 overflow-hidden">
          <Image
            src="/assets/story/product-story.avif"
            alt={t("pieceStoryTitle")}
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      </Container>
    </section>
  );
}
