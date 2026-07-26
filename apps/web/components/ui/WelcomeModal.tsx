"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LocaleSwitcher } from "@/shared/providers/locale-provider";

const WELCOME_SEEN_KEY = "dadan_welcome_seen";

interface WelcomeModalProps {
  displayName: string;
}

export function WelcomeModal({ displayName }: WelcomeModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex w-full max-w-4xl overflow-hidden bg-white shadow-xl md:flex-row">
        <button
          type="button"
          onClick={dismiss}
          className="absolute inset-e-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-white/90 text-[var(--color-text)] transition-colors hover:bg-white"
          aria-label="Close"
        >
          ×
        </button>
        <div className="relative hidden w-1/2 md:block">
          <Image
            src="/assets/dadan-model.png"
            alt="DADAN"
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col justify-center px-8 py-12">
          <h2 className="font-english text-3xl text-[var(--color-text)]">
            {t("title", { name: displayName })}
          </h2>
          <p className="mt-4 text-[var(--color-text-muted)]">
            {t("description")}
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="mt-8 inline-flex min-h-11 w-fit items-center gap-2 bg-[var(--color-accent)] px-6 text-sm tracking-[0.1em] uppercase text-white transition-opacity hover:opacity-90"
          >
            {t("cta")}
            <span className="rtl:rotate-180">→</span>
          </button>
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
      <LocaleSwitcher />
    </header>
  );
}
