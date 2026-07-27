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
