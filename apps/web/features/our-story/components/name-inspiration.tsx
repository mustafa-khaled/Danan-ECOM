import { getTranslations } from "next-intl/server";
import Container from "@/components/ui/container";
import Image from "next/image";

export async function NameInspiration() {
  const t = await getTranslations("ourStory");

  return (
    <section className="bg-ds-surface-rose lg:py-12 py-[32px]">
      <Container>
        {/* Title & Subtitle - Top */}
        <h2 className="font-heading font-extrabold text-h4 lg:text-[40px] text-ds-text">
          {t("nameTitle")}
        </h2>
        <p className="lg:mt-6 mt-[16px] lg:text-[32px] text-h6 text-ds-text-secondary font-body">
          {t("nameTagline")}
        </p>

        {/* Content grid */}
        <div className="mt-10.5 lg:mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left column spacer on desktop */}
          <div className="hidden lg:block" />

          {/* Right column content */}
          <div className="flex flex-col gap-6 lg:gap-8 col-span-2">
            <div className="flex flex-col gap-5 text-[14px] lg:text-h4 font-bold leading-[120%] text-ds-text-secondary font-body">
              <p>{t("namePara1")}</p>
              <p>{t("namePara2")}</p>
              <p>{t("namePara3")}</p>
            </div>

            <div className="relative lg:h-169.25 h-56.25 w-full overflow-hidden">
              <Image
                src="/assets/story/the-inspiration-behind-our-name.avif"
                alt={t("nameTitle")}
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
