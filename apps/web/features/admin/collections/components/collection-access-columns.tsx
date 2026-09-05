import { type ColumnDef } from "@/components/ui/data-table";
import type { AdminClientListItem } from "@/features/admin/types";
import { CollectionAccessRowActions } from "./collection-access-row-actions";
import { cn } from "@/lib/utils";

export const collectionAccessColumns: ColumnDef<AdminClientListItem>[] = [
  {
    key: "member",
    label: "Member",
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
    label: "Class",
    accessor: "memberClass",
    width: "140px",
    render: (v, row) => {
      const className =
        v ||
        (row.visibilityGroups?.length > 0
          ? row.visibilityGroups[0]
          : "Class A");
      return (
        <span className="inline-flex items-center px-2.5 py-1  text-xs font-semibold text-ds-text">
          {String(className)}
        </span>
      );
    },
  },
  {
    key: "accessStatus",
    label: "Access Status",
    accessor: "accessStatus",
    width: "160px",
    render: (v, row) => {
      const statusStr = String(
        v || (row.isActive ? "GRANTED" : "REVOKED"),
      ).toUpperCase();
      let badgeStyle = "bg-[#ECFDFD] text-[#4CBEAE]";
      let label = "Granted";

      if (statusStr.includes("PEND") || statusStr.includes("INVIT")) {
        badgeStyle = "bg-[#FFFBEB] text-[#D97706]";
        label = "Pending";
      } else if (statusStr.includes("REVOK") || statusStr.includes("INACT")) {
        badgeStyle = "bg-[#FEF2F2] text-[#EF4444]";
        label = "Revoked";
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
    label: "House Key",
    accessor: "houseKeyPrefix",
    width: "160px",
    render: (v, row) => {
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
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      );
    },
  },
  {
    key: "joined",
    label: "Joined",
    accessor: "joinedAt",
    width: "160px",
    render: (v, row) => {
      const dateVal = v || row.createdAt;
      if (!dateVal)
        return <span className="text-ds-text-secondary text-sm">—</span>;
      const d = new Date(String(dateVal));
      const formatted = isNaN(d.getTime())
        ? String(dateVal)
        : d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
      return (
        <span className="text-sm text-ds-text-secondary">{formatted}</span>
      );
    },
  },
  {
    key: "updatedAt",
    label: "Updated",
    accessor: "updatedAt",
    width: "160px",
    render: (v) => {
      if (!v) return <span className="text-ds-text-secondary text-sm">—</span>;
      const d = new Date(String(v));
      const formatted = isNaN(d.getTime())
        ? String(v)
        : d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
      return (
        <span className="text-sm text-ds-text-secondary">{formatted}</span>
      );
    },
  },
  {
    key: "actions",
    label: "Action",
    width: "107px",
    hideable: false,
    render: (_, row) => <CollectionAccessRowActions member={row} />,
  },
];
