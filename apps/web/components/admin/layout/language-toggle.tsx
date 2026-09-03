"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { LOCALE_COOKIE, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

function setLocaleCookie(locale: Locale) {
  const secure = window.location.protocol === "https:" ? ";Secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax${secure}`;
}

const languages: Record<Locale, { label: string; flag: string; alt: string }> = {
  en: {
    label: "EN",
    flag: "/admin/flag-uk.svg",
    alt: "English",
  },
  ar: {
    label: "AR",
    flag: "/admin/flag-sa.svg",
    alt: "العربية",
  },
};

interface LanguageToggleProps {
  className?: string;
}

export default function LanguageToggle({ className }: LanguageToggleProps) {
  const locale = (useLocale() as Locale) || "en";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentLang = languages[locale] || languages.en;

  function handleValueChange(value: string) {
    const nextLocale = value as Locale;
    if (nextLocale === locale) return;

    setLocaleCookie(nextLocale);
    if (typeof document !== "undefined") {
      document.documentElement.dir = nextLocale === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = nextLocale;
      document.body.className =
        nextLocale === "ar" ? "font-arabic" : "font-manrope";
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Select
      value={locale}
      onValueChange={handleValueChange}
      disabled={isPending}
    >
      <SelectTrigger
        size="sm"
        aria-label="Switch language"
        className={cn(
          "h-auto min-h-0 cursor-pointer border-none! bg-transparent px-1 py-1 shadow-none focus-visible:shadow-none focus-visible:border-none! flex items-center gap-1.5",
          className,
        )}
      >
        <div className="flex items-center gap-1.5">
          <Image
            src={currentLang.flag}
            alt={currentLang.alt}
            width={24}
            height={17}
            className="rounded-[2px] shadow-xs object-cover"
          />
          <span className="font-semibold text-xs text-ds-text uppercase">
            {currentLang.label}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-36">
        <SelectItem value="en" className="cursor-pointer py-2">
          <div className="flex items-center gap-2">
            <Image
              src="/admin/flag-uk.svg"
              alt="English"
              width={20}
              height={14}
              className="rounded-[2px] shadow-xs object-cover"
            />
            <span className="font-medium text-xs">English (EN)</span>
          </div>
        </SelectItem>
        <SelectItem value="ar" className="cursor-pointer py-2">
          <div className="flex items-center gap-2">
            <Image
              src="/admin/flag-sa.svg"
              alt="العربية"
              width={20}
              height={14}
              className="rounded-[2px] shadow-xs object-cover"
            />
            <span className="font-medium text-xs">العربية (AR)</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
