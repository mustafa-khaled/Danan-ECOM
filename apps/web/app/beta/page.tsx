"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/shared/lib/send-request";
import { validateRedirectPath } from "@/shared/lib/validate-redirect-path";
import { useValidateKey } from "@/features/auth";
import { LocaleSelect } from "@/shared/providers/locale-provider";
import Link from "next/link";

const BACKGROUND_IMAGES = [
  "/assets/dadan-model.avif",
  "/assets/coming-soon2.avif",
] as const;

const ROTATION_INTERVAL_MS = 6000;

export default function AccessGatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("accessGate");
  const [houseKey, setHouseKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const { validateKey, isPending } = useValidateKey();

  /* ── Background image rotation state ── */
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      try {
        await validateKey(houseKey);
        const next = validateRedirectPath(searchParams.get("next"));
        router.push(next);
        router.refresh();
      } catch (err) {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);

        if (err instanceof ApiError && err.status === 429) {
          setError(t("rateLimited"));
        } else if (nextAttempts >= 3) {
          setError(t("rateLimited"));
        } else {
          setError(t("accessDenied"));
        }
      }
    },
    [validateKey, houseKey, searchParams, router, attempts, t],
  );

  return (
    <div className="relative min-h-dvh w-full overflow-hidden">
      {/* ── Background images with crossfade ── */}
      {BACKGROUND_IMAGES.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt="DADAN campaign"
          fill
          priority={index === 0}
          quality={90}
          sizes="100vw"
          className="object-cover z-0 object-[30%]"
          style={{
            opacity: activeIndex === index ? 1 : 0,
            transition: "opacity 1s ease-in-out",
          }}
        />
      ))}

      {/* Full-screen gradient overlay */}
      <div
        className="absolute inset-0 z-1 pointer-events-none"
        style={{
          background:
            "linear-gradient(289.82deg, #AF6149 12.37%, rgba(65, 149, 155, 0) 76.59%)",
        }}
      />

      {/* Content panel — right-aligned on desktop, full overlay on mobile/tablet */}
      <div className="relative z-2 min-h-dvh ms-auto flex flex-col py-20.25 px-14 w-1/2 max-lg:w-3/5 max-md:w-full max-md:py-6 max-md:px-5 max-sm:px-4">
        {/* Header: logo + locale switcher */}
        <div className="flex items-center justify-between w-full access-gate-fade-in">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/dadan-logo.png"
              alt="DADAN"
              width={160}
              height={28}
              priority
              className="block invert brightness-0 max-sm:w-30 max-sm:h-auto"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </div>
          <LocaleSelect className="access-gate-locale-btn" />
        </div>

        {/* Main content — vertically centered */}
        <main className="flex flex-col justify-end flex-1 max-w-3xl py-8 max-md:max-w-full max-sm:py-4">
          <h1 className="font-english text-display font-bold text-white leading-[1.1] tracking-[-0.02em] mb-8 access-gate-animate-in max-lg:text-[56px] max-md:text-[44px] max-md:mb-6 max-sm:text-[32px] max-sm:mb-4">
            {t("title")}
          </h1>

          <h2 className="font-manrope text-[32px] font-semibold text-white/75 mb-4 leading-[1.2] tracking-[0%] access-gate-animate-in-delayed max-lg:text-[26px] max-md:text-[22px] max-sm:text-lg max-sm:mb-3">
            {t("welcome")}
          </h2>
          <p className="font-manrope text-[32px] font-normal text-white/90 leading-[1.2] tracking-[0%] mb-12 access-gate-animate-in-delayed max-lg:text-[26px] max-md:text-[22px] max-md:mb-8 max-sm:text-base max-sm:leading-relaxed max-sm:mb-6">
            {t("description")}
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2.5 access-gate-animate-in-delayed-2"
          >
            <label
              htmlFor="house-key"
              className="font-body text-sm font-semibold text-white tracking-[0.02em]"
            >
              {t("houseKey")}
            </label>
            <input
              id="house-key"
              name="houseKey"
              type="password"
              autoComplete="off"
              required
              value={houseKey}
              onChange={(event) => setHouseKey(event.target.value)}
              placeholder={t("houseKeyPlaceholder")}
              className="w-full py-3.5 px-5 bg-white border-none rounded-(--radius-md) font-body text-body text-ds-text outline-none transition-shadow duration-200 ease-in-out placeholder:text-ds-text-muted focus:shadow-[0_0_0_3px_rgba(255,255,255,0.25)] max-sm:py-3 max-sm:px-4 max-sm:text-sm"
            />
            {error ? (
              <p role="alert" className="text-body-sm text-red-300 mt-1">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full py-3.5 px-5 bg-white text-ds-text font-body text-body font-semibold rounded-(--radius-md) cursor-pointer transition-all duration-200 ease-in-out hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed max-sm:py-3 max-sm:px-4 max-sm:text-sm"
            >
              {isPending ? t("entering") : t("houseKey")}
            </button>
          </form>

          {/* Bottom navigation cards */}
          <div className="flex gap-4 mt-6 access-gate-animate-in-delayed-3 max-md:gap-3 max-sm:flex-col max-sm:gap-3">
            <Link
              href="/beta/pieces"
              className="flex items-center gap-3 justify-between flex-1 min-w-0 h-19 pt-3 pb-3 ps-3 pe-4 bg-ds-primary rounded-xl text-ds-primary-foreground no-underline transition-all duration-200 ease-in-out cursor-pointer hover:bg-ds-primary-hover hover:-translate-y-px group max-sm:h-16"
            >
              <div className="w-13 h-13 rounded-lg overflow-hidden shrink-0 relative max-sm:w-10 max-sm:h-10">
                <Image
                  src="/assets/featuredPieces.avif"
                  alt={t("featuredPieces")}
                  fill
                  sizes="52px"
                  className="object-cover"
                />
              </div>
              <span className="flex-1 font-body text-sm font-semibold leading-none tracking-tight max-sm:text-xs">
                {t("featuredPieces")}
              </span>
              <svg
                className="shrink-0 opacity-70 transition-all duration-200 ease-in-out group-hover:opacity-100 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M4 10H16M16 10L11 5M16 10L11 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="/beta/our-story"
              className="flex items-center gap-3 justify-between flex-1 min-w-0 h-19 pt-3 pb-3 ps-3 pe-4 bg-ds-primary rounded-xl text-ds-primary-foreground no-underline transition-all duration-200 ease-in-out cursor-pointer hover:bg-ds-primary-hover hover:-translate-y-px group max-sm:h-16"
            >
              <div className="w-13 h-13 rounded-lg overflow-hidden shrink-0 relative max-sm:w-10 max-sm:h-10">
                <Image
                  src="/assets/aboutTheHouse.avif"
                  alt={t("aboutTheHouse")}
                  fill
                  sizes="52px"
                  className="object-cover"
                  style={{ objectPosition: "70% center" }}
                />
              </div>
              <span className="flex-1 font-body text-sm font-semibold leading-none tracking-tight max-sm:text-xs">
                {t("aboutTheHouse")}
              </span>
              <svg
                className="shrink-0 opacity-70 transition-all duration-200 ease-in-out group-hover:opacity-100 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M4 10H16M16 10L11 5M16 10L11 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
