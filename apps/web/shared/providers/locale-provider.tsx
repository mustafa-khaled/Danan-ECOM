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
  const { updateProfile } = useUpdateProfile();

  function toggleLocale() {
    const nextLocale: Locale = locale === "ar" ? "en" : "ar";
    setLocaleCookie(nextLocale);

    if (syncProfile) {
      updateProfile({ locale: nextLocale });
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

interface LocaleSelectProps {
  className?: string;
  syncProfile?: boolean;
}

export function LocaleSelect({ className, syncProfile = false }: LocaleSelectProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { updateProfile } = useUpdateProfile();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value as Locale;
    if (nextLocale === locale) return;

    setLocaleCookie(nextLocale);

    if (syncProfile) {
      updateProfile({ locale: nextLocale });
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <select
      value={locale}
      onChange={handleChange}
      disabled={isPending}
      aria-label="Select language"
      className={
        className ??
        "cursor-pointer appearance-none border-none bg-transparent pe-4 text-[0.8125rem] font-medium tracking-wide text-[var(--color-text)] outline-none disabled:opacity-50"
      }
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23555' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right center",
        backgroundSize: "10px 6px",
      }}
    >
      <option value="en">EN</option>
      <option value="ar">AR</option>
    </select>
  );
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  return children;
}
