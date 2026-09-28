import { getTranslations } from "next-intl/server";
import { ShieldCheck, Award, Sparkles, Lock } from "lucide-react";
import { VerifyForm } from "@/components/verify-form";
import Container from "@/components/ui/container";

interface VerifyPageProps {
  searchParams?: Promise<{ serial?: string; token?: string }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = searchParams ? await searchParams : {};
  const t = await getTranslations("verify");
  const certT = await getTranslations("certificates");

  return (
    <div className="relative isolate min-h-[calc(100dvh-200px)] overflow-hidden py-12 sm:py-16 md:py-20 bg-ds-surface-warm/25">
      {/* Background ambient luxury lighting */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 flex justify-center overflow-hidden blur-3xl"
        aria-hidden="true"
      >
        <div className="h-100 w-162.5 rounded-full bg-linear-to-tr from-ds-primary/10 via-amber-200/15 to-stone-200/20 opacity-70" />
      </div>

      <Container className="flex flex-col items-center">
        {/* Centered Header Section */}
        <div className="w-full max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-ds-border-light bg-white/90 px-4 py-1.5 shadow-2xs backdrop-blur-xs">
            <ShieldCheck className="size-4 text-ds-primary" />
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-ds-secondary">
              {certT("certificateOfAuthenticity")}
            </span>
          </div>

          <h1 className="mt-4 font-heading text-3xl sm:text-4xl md:text-5xl font-normal text-ds-secondary tracking-tight">
            {t("title")}
          </h1>

          <p className="mt-3.5 mx-auto max-w-md text-sm sm:text-base text-ds-text-secondary leading-relaxed font-body">
            {t("description")}
          </p>
        </div>

        {/* Centered Form Wrapper */}
        <div className="mt-8 sm:mt-10 w-full max-w-xl">
          <VerifyForm
            initialSerial={params.serial}
            initialToken={params.token}
            autoVerify={Boolean(params.serial && params.token)}
            fullWidth
            showAuthenticityMessage
          />
        </div>

        {/* Trust & Verification Information Pillars */}
        <div className="mt-12 sm:mt-16 w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-ds-border-light/80 pt-8 sm:pt-10">
          <div className="flex flex-col items-center text-center px-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-ds-surface-rose text-ds-primary mb-3 shadow-2xs">
              <Sparkles className="size-4.5" />
            </div>
            <h3 className="font-heading text-base text-ds-text font-medium">
              {t("officialHeritage")}
            </h3>
            <p className="mt-1 text-xs text-ds-text-muted leading-relaxed font-body">
              {t("officialHeritageDesc")}
            </p>
          </div>

          <div className="flex flex-col items-center text-center px-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-ds-surface-warm text-ds-secondary mb-3 shadow-2xs">
              <Award className="size-4.5" />
            </div>
            <h3 className="font-heading text-base text-ds-text font-medium">
              {t("certificateCard")}
            </h3>
            <p className="mt-1 text-xs text-ds-text-muted leading-relaxed font-body">
              {t("certificateCardDesc")}
            </p>
          </div>

          <div className="flex flex-col items-center text-center px-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-ds-surface-rose text-ds-primary mb-3 shadow-2xs">
              <Lock className="size-4.5" />
            </div>
            <h3 className="font-heading text-base text-ds-text font-medium">
              {t("secureToken")}
            </h3>
            <p className="mt-1 text-xs text-ds-text-muted leading-relaxed font-body">
              {t("secureTokenDesc")}
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
