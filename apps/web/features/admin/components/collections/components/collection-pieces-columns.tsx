import { type ColumnDef } from "@/components/ui/data-table";
import type { AdminPieceListItem } from "@/features/admin/types";
import { CollectionPiecesRowActions } from "./collection-pieces-row-actions";

export const collectionPiecesColumns: ColumnDef<AdminPieceListItem>[] = [
  {
    key: "pieceName",
    label: "Piece Name",
    accessor: "designName",
    width: "220px",
    sortable: true,
    render: (_, row) => (
      <div className="truncate">
        <p className="font-medium text-ds-text truncate">
          {row.pieceName || row.designName}
        </p>
        <p className="text-xs text-ds-text-secondary font-mono mt-0.5">
          {row.serialNumber}
        </p>
      </div>
    ),
  },
  {
    key: "type",
    label: "Type",
    accessor: "type",
    width: "140px",
    render: (v, row) => (
      <span className="text-sm text-ds-text">
        {String(v || row.material || "Jewelry")}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    accessor: "status",
    width: "160px",
    render: (v) => {
      const statusStr = String(v || "AVAILABLE").toUpperCase();
      let badgeStyle = "bg-[#ECFDFD] text-[#4CBEAE]";
      let label = "Available";

      if (statusStr.includes("RESERV")) {
        badgeStyle = "bg-[#FFFBEB] text-[#D97706]";
        label = "Reserved";
      } else if (statusStr.includes("SOLD") || statusStr.includes("OWNED")) {
        badgeStyle = "bg-[#EFF6FF] text-[#3B82F6]";
        label = "Owned";
      } else if (statusStr.includes("VAULT") || statusStr.includes("ARCHIV")) {
        badgeStyle = "bg-[#F4F4F5] text-[#71717A]";
        label = "Vaulted";
      } else if (statusStr.includes("TRANSFER")) {
        badgeStyle = "bg-[#FAF5FF] text-[#9333EA]";
        label = "In Transfer";
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
    key: "ownership",
    label: "Ownership",
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
            {isOwned ? row.currentOwner : "Available"}
          </span>
        </div>
      );
    },
  },
  {
    key: "access",
    label: "Access",
    accessor: "access",
    width: "160px",
    render: (v, row) => {
      const groups = row.visibilityGroups ?? [];
      const accessLabel =
        v || (groups.length > 0 ? groups.join(", ") : "All Clients");
      return (
        <span className="text-sm text-ds-text truncate block">
          {String(accessLabel)}
        </span>
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
    render: (_, row) => <CollectionPiecesRowActions piece={row} />,
  },
];
