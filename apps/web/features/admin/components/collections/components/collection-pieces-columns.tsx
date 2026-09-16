import { type ColumnDef } from "@/components/ui/data-table";
import type { AdminPieceListItem } from "@/features/admin/types";
import { CollectionPiecesRowActions } from "./collection-pieces-row-actions";
import { pickLocalized } from "@/shared/lib/pick-localized";
import { formatAdminDate } from "@/shared/utils/format";
import type { Locale } from "@/i18n/routing";

type TranslateFn = (key: string) => string;

export function getCollectionPiecesColumns(
  t: TranslateFn,
  locale: Locale,
): ColumnDef<AdminPieceListItem>[] {
  function statusLabel(statusStr: string) {
    if (statusStr.includes("RESERV")) return t("status.reserved");
    if (statusStr.includes("SOLD") || statusStr.includes("OWNED")) return t("status.owned");
    if (statusStr.includes("VAULT") || statusStr.includes("ARCHIV")) return t("status.vaulted");
    if (statusStr.includes("TRANSFER")) return t("status.inTransfer");
    return t("status.available");
  }

  return [
    {
      key: "name",
      label: t("pieces.name"),
      accessor: "name",
      width: "220px",
      sortable: true,
      render: (_, row) => (
        <div className="truncate">
          <p className="font-medium text-ds-text truncate">
            {pickLocalized(locale, row.name, row.nameAr)}
          </p>
          <p className="text-xs text-ds-text-secondary font-mono mt-0.5">
            {row.serialNumber}
          </p>
        </div>
      ),
    },
    {
      key: "material",
      label: t("common.material"),
      accessor: "material",
      width: "140px",
      render: (_, row) => (
        <span className="text-sm text-ds-text">
          {pickLocalized(locale, row.material ?? "", row.materialAr) || "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: t("common.status"),
      accessor: "status",
      width: "160px",
      render: (v) => {
        const statusStr = String(v || "AVAILABLE").toUpperCase();
        let badgeStyle = "bg-[#ECFDFD] text-[#4CBEAE]";
        if (statusStr.includes("RESERV")) badgeStyle = "bg-[#FFFBEB] text-[#D97706]";
        else if (statusStr.includes("SOLD") || statusStr.includes("OWNED"))
          badgeStyle = "bg-[#EFF6FF] text-[#3B82F6]";
        else if (statusStr.includes("VAULT") || statusStr.includes("ARCHIV"))
          badgeStyle = "bg-[#F4F4F5] text-[#71717A]";
        else if (statusStr.includes("TRANSFER"))
          badgeStyle = "bg-[#FAF5FF] text-[#9333EA]";

        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badgeStyle}`}
          >
            {statusLabel(statusStr)}
          </span>
        );
      },
    },
    {
      key: "ownership",
      label: t("pieces.ownership"),
      accessor: (row) => (row.currentOwner ? "Owned" : "Available"),
      width: "160px",
      render: (_, row) => {
        const isOwned = Boolean(row.currentOwner);
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`size-2 rounded-full ${
                isOwned ? "bg-[#3B82F6]" : "bg-[#4CBEAE]"
              }`}
            />
            <span className="text-sm font-medium text-ds-text">
              {isOwned ? row.currentOwner : t("status.available")}
            </span>
          </div>
        );
      },
    },
    {
      key: "access",
      label: t("common.collection"),
      accessor: (row) => pickLocalized(locale, row.collection, row.collectionAr),
      width: "160px",
      render: (v) => (
        <span className="text-sm text-ds-text truncate block">{String(v)}</span>
      ),
    },
    {
      key: "updatedAt",
      label: t("common.updated"),
      accessor: "updatedAt",
      width: "160px",
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
      render: (_, row) => <CollectionPiecesRowActions piece={row} />,
    },
  ];
}
