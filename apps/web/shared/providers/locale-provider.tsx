"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
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

function setLocaleCookie(locale: Locale) {
  const secure = window.location.protocol === "https:" ? ";Secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax${secure}`;
}

interface LocaleSelectProps {
  className?: string;
  syncProfile?: boolean;
}

export function LocaleSelect({
  className,
  syncProfile = false,
}: LocaleSelectProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { updateProfile } = useUpdateProfile();

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

    if (syncProfile) {
      updateProfile({ locale: nextLocale });
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
          "h-auto min-h-0 cursor-pointer border-none! bg-transparent px-0 py-0 font-['Poppins',sans-serif] font-normal text-h5 leading-none text-center shadow-none focus-visible:shadow-none focus-visible:border-none! flex items-center gap-1 [&_svg]:text-inherit [&_svg]:opacity-100! [&_svg]:rtl:rotate-0! [&_svg]:w-[24.5px]! [&_svg]:h-6!",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem
          value="en"
          className="font-['Poppins',sans-serif] font-normal leading-none text-center"
        >
          EN
        </SelectItem>
        <SelectItem
          value="ar"
          className="font-['Poppins',sans-serif] font-normal leading-none text-center"
        >
          AR
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
