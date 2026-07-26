"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCALE_COOKIE, type Locale } from "@/i18n/routing";
import { useUpdateProfile } from "@/features/profile";
import { cn } from "@/lib/utils";

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
        "inline-flex items-center gap-1 rounded border border-border bg-transparent px-3 py-1.5 text-[0.8125rem] font-medium tracking-wide text-(--color-text) transition-colors hover:border-[#999] disabled:opacity-50"
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

  function handleValueChange(value: string) {
    const nextLocale = value as Locale;
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
    <Select value={locale} onValueChange={handleValueChange} disabled={isPending}>
      <SelectTrigger
        size="sm"
        aria-label="Select language"
        className={cn(
          "h-auto min-h-0 cursor-pointer border-none bg-transparent px-0 py-0 text-[0.8125rem] font-medium tracking-wide shadow-none focus-visible:shadow-none",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="en">EN</SelectItem>
        <SelectItem value="ar">AR</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  return children;
}
