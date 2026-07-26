"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/shared/lib/send-request";
import { validateRedirectPath } from "@/shared/lib/validate-redirect-path";
import { useValidateKey } from "@/features/auth";
import { LocaleSwitcher } from "@/shared/providers/locale-provider";

export default function AccessGatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("accessGate");
  const [houseKey, setHouseKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const { validateKey } = useValidateKey();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
  }

  return (
    <div className="relative min-h-dvh w-full overflow-hidden flex flex-row max-md:flex-col">
      {/* Full-screen background image */}
      <Image
        src="/assets/dadan-model.png"
        alt="DADAN campaign"
        fill
        priority
        quality={90}
        className="object-cover object-top z-0"
      />

      {/* Full-screen gradient overlay */}
      <div
        className="absolute inset-0 z-1 pointer-events-none"
        style={{
          background:
            "linear-gradient(289.82deg, #AF6149 12.37%, rgba(65, 149, 155, 0) 76.59%)",
        }}
      />

      {/* Right half — content */}
      <div className="relative z-2 w-1/2 min-h-dvh ms-auto flex flex-col py-8 px-14 max-md:w-full max-md:min-h-auto max-md:py-6 max-md:px-5">
        {/* Header: logo + switcher at top of right half */}
        <div className="flex items-center justify-between w-full access-gate-fade-in">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/dadan-logo.png"
              alt="DADAN"
              width={160}
              height={28}
              priority
              className="block invert brightness-0"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </div>
          <LocaleSwitcher className="access-gate-locale-btn" />
        </div>

        {/* Main content — vertically centered */}
        <main className="flex flex-col justify-center flex-1 max-w-135 py-8 max-md:max-w-full">
          <h1 className="font-english text-5xl font-normal italic text-white leading-[1.15] mb-8 access-gate-animate-in max-md:text-4xl">
            {t("title")}
          </h1>

          <h2 className="font-manrope text-lg font-normal text-white/75 mb-2 tracking-[0.01em] access-gate-animate-in-delayed max-md:text-base">
            {t("welcome")}
          </h2>
          <p className="font-manrope text-lg font-normal text-white/90 leading-relaxed mb-10 max-w-110 access-gate-animate-in-delayed max-md:text-base">
            {t("description")}
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2.5 access-gate-animate-in-delayed-2"
          >
            <label
              htmlFor="house-key"
              className="font-manrope text-sm font-semibold text-white tracking-[0.02em]"
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
              className="w-full py-3.5 px-5 bg-white border-none rounded-md font-manrope text-[0.9375rem] text-admin-text outline-none transition-shadow duration-200 ease-in-out placeholder:text-[#999999] placeholder:italic focus:shadow-[0_0_0_3px_rgba(255,255,255,0.25)]"
            />
            <button
              type="submit"
              className="w-full py-3.5 rounded-md font-manrope text-sm font-semibold tracking-[0.02em] bg-white/15 text-white border border-white/20 transition-colors duration-200 hover:bg-white/25 cursor-pointer access-gate-animate-in-delayed-2"
            >
              {t("houseKey")}
            </button>

            {error ? (
              <p role="alert" className="text-[0.8125rem] text-red-300 mt-1">
                {error}
              </p>
            ) : null}
          </form>

          {/* Bottom navigation cards */}
          <div className="flex gap-4 mt-6 access-gate-animate-in-delayed-3 max-md:flex-col">
            <a
              href="#"
              className="flex items-center gap-3 flex-1 py-2.5 px-4 bg-white/15 backdrop-blur-md border border-white/20 rounded-lg text-white no-underline transition-all duration-250 ease-in-out cursor-pointer hover:bg-white/22 hover:border-white/35 hover:-translate-y-px group"
            >
              <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 relative">
                <Image
                  src="/assets/dadan-model.png"
                  alt={t("featuredPieces")}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="flex-1 font-manrope text-[0.9375rem] font-medium tracking-[0.01em]">
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
            </a>
            <a
              href="#"
              className="flex items-center gap-3 flex-1 py-2.5 px-4 bg-white/15 backdrop-blur-md border border-white/20 rounded-lg text-white no-underline transition-all duration-250 ease-in-out cursor-pointer hover:bg-white/22 hover:border-white/35 hover:-translate-y-px group"
            >
              <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 relative">
                <Image
                  src="/assets/dadan-model.png"
                  alt={t("aboutTheHouse")}
                  fill
                  className="object-cover"
                  style={{ objectPosition: "70% center" }}
                />
              </div>
              <span className="flex-1 font-manrope text-[0.9375rem] font-medium tracking-[0.01em]">
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
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
