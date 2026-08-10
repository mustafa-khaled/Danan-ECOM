"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LocaleSelect } from "@/shared/providers/locale-provider";
import { useClientContext } from "@/shared/providers/client-context";
import { Button } from "./Button";

const WELCOME_SEEN_KEY = "dadan_welcome_seen";

export function WelcomeModal() {
  const { displayName } = useClientContext();
  const t = useTranslations("welcome");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(WELCOME_SEEN_KEY);
    if (!seen) {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(WELCOME_SEEN_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ds-overlay-heavy p-4">
      <div className="relative flex w-full max-w-4xl overflow-hidden bg-ds-background rounded-lg border border-ds-border shadow-xl md:flex-row">
        <button
          type="button"
          onClick={dismiss}
          className="absolute inset-e-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-ds-background/90 text-ds-text transition-colors hover:bg-ds-surface"
          aria-label="Close"
        >
          ×
        </button>
        <div className="relative hidden w-1/2 md:block">
          <Image
            src="/assets/dadan-model.avif"
            alt="DADAN"
            fill
            sizes="(max-width: 768px) 0px, 448px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col justify-center px-8 py-12">
          <h2 className="font-heading text-3xl text-ds-text">
            {t("title", { name: displayName })}
          </h2>
          <p className="mt-4 text-ds-text-secondary">{t("description")}</p>
          <div className="mt-8">
            <Button
              onClick={dismiss}
              variant="secondary"
              arrow
            >
              {t("cta")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AccessGateHeader() {
  return (
    <header className="mb-12 flex items-center justify-between">
      <div className="relative">
        <Image
          src="/assets/dadan-logo.png"
          alt="DADAN"
          width={140}
          height={24}
          priority
          className="block invert"
        />
      </div>
      <LocaleSelect />
    </header>
  );
}
