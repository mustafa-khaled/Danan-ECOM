import { Image as ImageIcon } from "lucide-react";
import { type ColumnDef } from "@/components/ui/data-table";
import type { AdminCollectionListItem } from "@/features/admin/types";
import { CollectionRowActions } from "./collection-row-actions";

export const collectionColumns: ColumnDef<AdminCollectionListItem>[] = [
  {
    key: "name",
    label: "Collection Name",
    accessor: "name",
    width: "195px",
    sortable: true,
    render: (_, row) => (
      <div className="truncate">
        <p className="font-medium text-ds-text truncate">{row.name}</p>
        {row.nameAr && (
          <p className="text-xs text-ds-text-secondary truncate mt-0.5">
            {row.nameAr}
          </p>
        )}
      </div>
    ),
  },
  {
    key: "cover",
    label: "Cover",
    accessor: "coverImageUrl",
    width: "121px",
    render: (v, row) => (
      <div className="flex items-center">
        {v ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={String(v)}
            alt={row.name}
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
    label: "Status",
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
          {isPublished ? "Published" : "Draft"}
        </span>
      );
    },
  },
  {
    key: "pieces",
    label: "Pieces",
    accessor: (row) => row.pieceCount ?? row.designCount ?? 0,
    width: "195px",
    render: (v) => (
      <span className="tabular-nums text-ds-text text-sm font-normal">
        {String(v)}
      </span>
    ),
  },
  {
    key: "owners",
    label: "Owners",
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
    label: "Access",
    accessor: "visibilityGroups",
    width: "195px",
    render: (v) => {
      const groups = Array.isArray(v) ? v : [];
      return (
        <span className="text-sm text-ds-text truncate block">
          {groups.length > 0 ? groups.join(", ") : "All Clients"}
        </span>
      );
    },
  },
  {
    key: "updatedAt",
    label: "Last Updated",
    accessor: "updatedAt",
    width: "195px",
    render: (v) => {
      if (!v) return <span className="text-ds-text-secondary text-sm">—</span>;
      const d = new Date(String(v));
      const formatted = isNaN(d.getTime())
        ? String(v)
        : d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
      return <span className="text-sm text-ds-text-secondary">{formatted}</span>;
    },
  },
  {
    key: "actions",
    label: "Action",
    width: "107px",
    hideable: false,
    render: (_, row) => <CollectionRowActions collection={row} />,
  },
];
