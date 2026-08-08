import { getTranslations } from "next-intl/server";
import { VerifyForm } from "@/components/verify-form";
import Container from "@/components/ui/container";
import { SectionHead } from "@/components/ui";

export default async function VerifyPage() {
  const t = await getTranslations("verify");

  return (
    <Container className="py-4">
      <SectionHead title={t("title")} subtitle={t("description")} />

      <VerifyForm />
    </Container>
  );
}
