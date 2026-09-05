"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Eye, Pencil, EllipsisVertical } from "lucide-react";
import type { AdminCollectionListItem } from "@/features/admin/types";

interface CollectionRowActionsProps {
  collection: AdminCollectionListItem;
}

export function CollectionRowActions({
  collection,
}: CollectionRowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="h-8 w-8 rounded-lg flex items-center justify-center text-ds-text-secondary hover:text-ds-text hover:bg-ds-surface transition-colors focus:outline-none"
        aria-expanded={isOpen}
        aria-label="Collection actions"
      >
        <EllipsisVertical className="size-5" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-1 z-30 w-36 rounded-lg border border-ds-border bg-ds-background shadow-lg py-1 animate-in fade-in zoom-in-95"
        >
          <Link
            href={`/admin/collections/${collection.id}`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-ds-text hover:bg-ds-surface hover:text-(--color-gold) transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View Details</span>
          </Link>
          <Link
            href={`/admin/collections/${collection.id}/edit`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-ds-text hover:bg-ds-surface hover:text-(--color-gold) transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit Collection</span>
          </Link>
        </div>
      )}
    </div>
  );
}
