"use client";

import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import { useUpdateProfile } from "@/features/profile";

interface ProfileFormProps {
  initial: {
    displayName: string;
    phone: string;
  };
}

export function ProfileForm({ initial }: ProfileFormProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const [phone, setPhone] = useState(initial.phone);
  const updateProfile = useUpdateProfile();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await updateProfile.mutateAsync({ phone });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-2">
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-[var(--color-text)]">
          {t("name")}
        </label>
        <input
          id="name"
          type="text"
          value={initial.displayName}
          disabled
          className="w-full border border-[var(--color-border)] bg-[var(--color-form-field)] px-4 py-3 text-sm text-[var(--color-text-muted)]"
        />
      </div>
      <div>
        <label htmlFor="phone" className="mb-2 block text-sm font-medium text-[var(--color-text)]">
          {t("phone")}
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
        />
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="inline-flex min-h-11 items-center bg-[var(--color-accent)] px-6 text-sm tracking-[0.1em] uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {updateProfile.isPending ? tCommon("loading") : tCommon("save")}
        </button>
      </div>
    </form>
  );
}
