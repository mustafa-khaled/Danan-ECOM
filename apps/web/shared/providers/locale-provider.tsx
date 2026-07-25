"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { LOCALE_COOKIE, type Locale } from "@/i18n/routing";
import { useUpdateProfile } from "@/features/profile";

interface LocaleSwitcherProps {
  className?: string;
  syncProfile?: boolean;
}

function setLocaleCookie(locale: Locale) {
  const secure = window.location.protocol === "https:" ? ";Secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax${secure}`;
}

export function LocaleSwitcher({ className, syncProfile = false }: LocaleSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const updateProfile = useUpdateProfile();

  function toggleLocale() {
    const nextLocale: Locale = locale === "ar" ? "en" : "ar";
    setLocaleCookie(nextLocale);

    if (syncProfile) {
      updateProfile.mutate({ locale: nextLocale });
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggleLocale}
      disabled={isPending}
      className={
        className ??
        "inline-flex items-center gap-1 rounded border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-[0.8125rem] font-medium tracking-wide text-[var(--color-text)] transition-colors hover:border-[#999] disabled:opacity-50"
      }
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      {locale === "ar" ? "EN" : "AR"}
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
        className="rtl:rotate-180"
      >
        <path
          d="M3 4.5L6 7.5L9 4.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  return children;
}
