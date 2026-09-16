import { type ColumnDef } from "@/components/ui/data-table";
import type { AdminClientListItem } from "@/features/admin/types";
import { CollectionAccessRowActions } from "./collection-access-row-actions";
import { cn } from "@/lib/utils";
import { pickLocalized } from "@/shared/lib/pick-localized";
import { formatAdminDate } from "@/shared/utils/format";
import type { Locale } from "@/i18n/routing";

type TranslateFn = (key: string) => string;

export function getCollectionAccessColumns(
  t: TranslateFn,
  locale: Locale,
): ColumnDef<AdminClientListItem>[] {
  return [
    {
      key: "member",
      label: t("payments.member"),
      accessor: "displayName",
      width: "220px",
      sortable: true,
      render: (_, row) => (
        <div className="truncate">
          <p className="font-medium text-ds-text truncate">{row.displayName}</p>
          <p className="text-xs text-ds-text-secondary truncate mt-0.5">
            {row.email}
          </p>
        </div>
      ),
    },
    {
      key: "class",
      label: t("members.class"),
      accessor: (row) =>
        pickLocalized(locale, row.class?.name ?? row.memberClass ?? "", row.class?.nameAr),
      width: "140px",
      render: (v) => (
        <span className="inline-flex items-center px-2.5 py-1  text-xs font-semibold text-ds-text">
          {String(v || "—")}
        </span>
      ),
    },
    {
      key: "accessStatus",
      label: t("collections.access"),
      accessor: "accessStatus",
      width: "160px",
      render: (v, row) => {
        const statusStr = String(
          v || (row.isActive ? "GRANTED" : "REVOKED"),
        ).toUpperCase();
        let badgeStyle = "bg-[#ECFDFD] text-[#4CBEAE]";
        let label = t("status.granted");

        if (statusStr.includes("PEND") || statusStr.includes("INVIT")) {
          badgeStyle = "bg-[#FFFBEB] text-[#D97706]";
          label = t("status.pending");
        } else if (statusStr.includes("REVOK") || statusStr.includes("INACT")) {
          badgeStyle = "bg-[#FEF2F2] text-[#EF4444]";
          label = t("status.revoked");
        }

        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badgeStyle}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      key: "houseKey",
      label: t("members.houseKey"),
      accessor: "houseKeyPrefix",
      width: "160px",
      render: (_, row) => {
        const isActive = row.isActive !== false;
        return (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs px-2.5 py-1 rounded-lg",
                isActive
                  ? "bg-[#ECFDFD] text-[#4CBEAE]"
                  : "bg-[#FEF2F2] text-[#EF4444]",
              )}
            >
              {isActive ? t("status.active") : t("status.inactive")}
            </span>
          </div>
        );
      },
    },
    {
      key: "joined",
      label: t("members.joined"),
      accessor: "joinedAt",
      width: "160px",
      render: (v, row) => {
        const dateVal = v || row.createdAt;
        if (!dateVal)
          return <span className="text-ds-text-secondary text-sm">—</span>;
        return (
          <span className="text-sm text-ds-text-secondary">
            {formatAdminDate(String(dateVal), locale)}
          </span>
        );
      },
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
      render: (_, row) => <CollectionAccessRowActions member={row} />,
    },
  ];
}
