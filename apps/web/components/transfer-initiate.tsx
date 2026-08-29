"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { useInitiateTransfer } from "@/features/transfers";
import { Button, Input } from "@/components/ui";

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
    const recipientHouseId = String(form.get("recipientHouseId") ?? "")
      .trim()
      .toUpperCase();
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
      <Button
        type="button"
        onClick={() => setOpen(true)}
        variant="teal"
        size="lg"
        fullWidth
        className="font-heading lg:text-h4 font-bold text-h6 text-neutral-900"
        iconRight={
          <Image
            src="/shopping.png"
            alt="Transfer"
            width={28}
            height={28}
            className="lg:size-7 size-6 object-contain"
          />
        }
      >
        {wardrobeT("transferOwnership")}
      </Button>
    );
  }

  return (
    <section className="w-full rounded-(--radius-md) border border-ds-border bg-ds-background p-5 space-y-4 shadow-sm">
      <div>
        <h2 className="font-heading text-base font-bold text-ds-text">
          {wardrobeT("transferOwnership")}
        </h2>
        <p className="mt-1 text-xs text-ds-text-secondary font-body">
          {t("initiateDescription", { pieceName, serialNumber })}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="transferType" className="ds-label text-ds-text">
            {t("transferType")}
          </label>
          <select
            id="transferType"
            name="transferType"
            defaultValue="GIFT"
            className="min-h-11 w-full rounded-(--radius-sm) border border-ds-border bg-ds-background px-3 text-sm text-ds-text font-body outline-none focus:border-ds-border-focus"
          >
            {TRANSFER_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label={t("recipientHouseId")}
          name="recipientHouseId"
          type="text"
          required
          autoComplete="off"
          maxLength={6}
          pattern="[A-Za-z0-9]{6}"
          placeholder={t("recipientHouseIdPlaceholder")}
          className="uppercase"
        />

        {error ? (
          <p role="alert" className="text-xs text-ds-error">
            {error instanceof Error ? error.message : t("initiateError")}
          </p>
        ) : null}

        <div className="flex gap-3 pt-1">
          <Button
            type="submit"
            loading={isPending}
            variant="teal"
            size="md"
            fullWidth
            iconRight={<CheckCircle2 className="size-4" />}
          >
            Submit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setOpen(false)}
          >
            {common("cancel")}
          </Button>
        </div>
      </form>
    </section>
  );
}
