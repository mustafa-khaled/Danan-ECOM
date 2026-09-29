import { getTranslations } from "next-intl/server";
import { CollectionsBanner, CollectionsCatalog } from "@/features/collections";
import Container from "@/components/ui/container";

export default async function CollectionsPage() {
  const t = await getTranslations("collections");

  return (
    <>
      <CollectionsBanner />

      <Container className="lg:py-[64px] py-[32px]">
        <h1 className="mb-[16px] font-heading text-h4 font-bold text-neutral-900 lg:mb-[32px] lg:text-h1">
          {t("title")}
        </h1>
        <CollectionsCatalog />
      </Container>
    </>
  );
}
