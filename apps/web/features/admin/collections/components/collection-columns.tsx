import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { type ColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/Badge";
import type { AdminCollectionListItem } from "@/features/admin/types";

export const collectionColumns: ColumnDef<AdminCollectionListItem>[] = [
  {
    key: "name",
    label: "Name",
    accessor: "name",
    sortable: true,
    render: (_, row) => (
      <div>
        <p className="font-medium text-ds-text">{row.name}</p>
        <p className="text-xs text-ds-text-secondary mt-0.5">{row.nameAr}</p>
      </div>
    ),
  },
  {
    key: "slug",
    label: "Slug",
    accessor: "slug",
    render: (v) => (
      <span className="font-mono text-xs text-ds-text-secondary">
        {String(v)}
      </span>
    ),
  },
  {
    key: "designs",
    label: "Designs",
    accessor: "designCount",
    align: "center",
    sortable: true,
    render: (v) => (
      <span className="tabular-nums text-ds-text">{String(v)}</span>
    ),
  },
  {
    key: "visibility",
    label: "Visible",
    accessor: "isVisible",
    align: "center",
    render: (v) => (
      <Badge variant={v ? "success" : "default"}>
        {v ? "Yes" : "No"}
      </Badge>
    ),
  },
  {
    key: "sortOrder",
    label: "Order",
    accessor: "sortOrder",
    align: "center",
    sortable: true,
    render: (v) => (
      <span className="tabular-nums text-ds-text-secondary text-xs">
        {String(v)}
      </span>
    ),
  },
  {
    key: "actions",
    label: "Actions",
    align: "right",
    hideable: false,
    render: (_, row) => (
      <div className="flex items-center justify-end gap-3">
        <Link
          href={`/admin/collections/${row.id}`}
          className="inline-flex items-center gap-1 text-xs uppercase tracking-widest font-semibold text-ds-primary hover:text-(--color-gold) transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Link>
        <Link
          href={`/admin/collections/${row.id}/edit`}
          className="inline-flex items-center gap-1 text-xs uppercase tracking-widest font-semibold text-ds-text-secondary hover:text-(--color-gold) transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Link>
      </div>
    ),
  },
];
