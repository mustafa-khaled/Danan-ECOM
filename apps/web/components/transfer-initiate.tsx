"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { useInitiateTransfer } from "@/features/transfers";
import { DadanSpinner } from "@/shared/components/feedback/loading-state";

interface TransferInitiateProps {
  pieceId: string;
  pieceName: string;
  serialNumber: string;
}

export function TransferInitiate({
  pieceId,
  pieceName,
  serialNumber,
}: TransferInitiateProps) {
  const router = useRouter();
  const t = useTranslations("transfers");
  const common = useTranslations("common");
  const wardrobeT = useTranslations("wardrobe");
  const [open, setOpen] = useState(false);
  const { initiateTransfer, isPending, error } = useInitiateTransfer();

  const TRANSFER_TYPES = [
    { value: "GIFT", label: t("gift") },
    { value: "SALE", label: t("sale") },
    { value: "INHERITANCE", label: t("inheritance") },
  ] as const;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const recipientHouseId = String(
      form.get("recipientHouseId") ?? "",
    ).trim().toUpperCase();
    const transferType = String(form.get("transferType") ?? "GIFT") as
      | "SALE"
      | "GIFT"
      | "INHERITANCE";

    try {
      const result = await initiateTransfer({
        pieceId,
        transferType,
        recipientHouseId,
      });
      router.push(`/beta/profile/transfers/${result.transferId}`);
    } catch {
      /* error is rendered via the mutation's `error` state */
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-[2px] bg-[#4CBEAE] px-4 text-center font-display text-sm font-semibold tracking-normal text-[#2D2321] transition-all hover:bg-[#45B1A1] active:scale-[0.99]"
      >
        <span>{wardrobeT("transferOwnership")}</span>
        <Image
          src="/shopping.png"
          alt="Transfer"
          width={18}
          height={18}
          className="size-4.5 object-contain"
        />
      </button>
    );
  }

  return (
    <section className="w-full rounded-[2px] border border-gray-200 bg-white p-5 space-y-4">
      <div>
        <h2 className="font-display text-base font-bold text-[#2D2321]">
          {wardrobeT("transferOwnership")}
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          {t("initiateDescription", { pieceName, serialNumber })}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="block text-xs font-semibold text-[#2D2321]">
            {t("transferType")}
          </span>
          <select
            name="transferType"
            defaultValue="GIFT"
            className="h-11 w-full rounded-[2px] border border-gray-200 bg-gray-50 px-3 text-sm text-[#2D2321] focus:border-[#4CBEAE] focus:bg-white focus:outline-none"
          >
            {TRANSFER_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="block text-xs font-semibold text-[#2D2321]">
            {t("recipientHouseId")}
          </span>
          <input
            name="recipientHouseId"
            type="text"
            required
            autoComplete="off"
            maxLength={6}
            pattern="[A-Za-z0-9]{6}"
            placeholder={t("recipientHouseIdPlaceholder")}
            className="h-11 w-full rounded-[2px] border border-gray-200 bg-gray-50 px-3 text-sm uppercase text-[#2D2321] placeholder:text-gray-400 placeholder:normal-case focus:border-[#4CBEAE] focus:bg-white focus:outline-none"
          />
        </label>

        {error ? (
          <p role="alert" className="text-xs text-red-600">
            {error instanceof Error ? error.message : t("initiateError")}
          </p>
        ) : null}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[2px] bg-[#4CBEAE] px-4 font-display text-sm font-semibold text-[#2D2321] transition-all hover:bg-[#45B1A1] disabled:opacity-50"
          >
            {isPending ? (
              <DadanSpinner size="sm" />
            ) : (
              <>
                <span>Submit</span>
                <CheckCircle2 className="size-4 text-[#2D2321]" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-11 items-center justify-center rounded-[2px] border border-gray-200 bg-white px-4 font-display text-sm font-medium text-[#2D2321] hover:bg-gray-50"
          >
            {common("cancel")}
          </button>
        </div>
      </form>
    </section>
  );
}
