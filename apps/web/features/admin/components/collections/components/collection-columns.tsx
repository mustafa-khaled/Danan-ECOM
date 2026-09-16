import { Image as ImageIcon } from "lucide-react";
import { type ColumnDef } from "@/components/ui/data-table";
import type { AdminCollectionListItem } from "@/features/admin/types";
import { CollectionRowActions } from "./collection-row-actions";
import { pickLocalized } from "@/shared/lib/pick-localized";
import { formatAdminDate } from "@/shared/utils/format";
import type { Locale } from "@/i18n/routing";

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

export function getCollectionColumns(
  t: TranslateFn,
  locale: Locale,
): ColumnDef<AdminCollectionListItem>[] {
  return [
    {
      key: "name",
      label: t("collections.name"),
      accessor: "name",
      width: "195px",
      sortable: true,
      render: (_, row) => {
        const name = pickLocalized(locale, row.name, row.nameAr);
        return (
          <div className="truncate">
            <p className="font-medium text-ds-text truncate">{name}</p>
          </div>
        );
      },
    },
    {
      key: "cover",
      label: t("common.cover"),
      accessor: "coverImageUrl",
      width: "121px",
      render: (v, row) => (
        <div className="flex items-center">
          {v ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={String(v)}
              alt={pickLocalized(locale, row.name, row.nameAr)}
              className="h-10 w-10 rounded-lg object-cover bg-ds-surface border border-ds-border/40"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-ds-surface flex items-center justify-center text-ds-text-secondary border border-ds-border/40">
              <ImageIcon className="h-4 w-4 opacity-40" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: t("common.status"),
      accessor: "isVisible",
      width: "190px",
      render: (v) => {
        const isPublished = Boolean(v);
        return (
          <span
            className={
              isPublished
                ? "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ECFDFD] text-[#4CBEAE]"
                : "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F4F4F5] text-[#71717A]"
            }
          >
            {isPublished ? t("status.published") : t("status.draft")}
          </span>
        );
      },
    },
    {
      key: "pieces",
      label: t("collections.pieces"),
      accessor: (row) => row.pieceCount ?? 0,
      width: "195px",
      render: (v) => (
        <span className="tabular-nums text-ds-text text-sm font-normal">
          {String(v)}
        </span>
      ),
    },
    {
      key: "owners",
      label: t("collections.owners"),
      accessor: "ownerCount",
      width: "195px",
      render: (v) => (
        <span className="tabular-nums text-ds-text text-sm font-normal">
          {v != null ? String(v) : "—"}
        </span>
      ),
    },
    {
      key: "access",
      label: t("collections.access"),
      accessor: (row) =>
        row.classes?.length
          ? row.classes.map((cls) => pickLocalized(locale, cls.name, cls.nameAr)).join(", ")
          : "",
      width: "195px",
      render: (v) => (
        <span className="text-sm text-ds-text truncate block">
          {String(v) || t("common.noClasses")}
        </span>
      ),
    },
    {
      key: "updatedAt",
      label: t("common.lastUpdated"),
      accessor: "updatedAt",
      width: "195px",
      render: (v) => {
        if (!v) return <span className="text-ds-text-secondary text-sm">—</span>;
        return (
          <span className="text-sm text-ds-text-secondary">
            {formatAdminDate(String(v), locale)}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: t("common.action"),
      width: "107px",
      hideable: false,
      render: (_, row) => <CollectionRowActions collection={row} />,
    },
  ];
}
