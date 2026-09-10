"use client";

import { Input } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface OwnershipTableFilterProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  collectionFilter?: string;
  onCollectionFilterChange?: (value: string) => void;
  transferTypeFilter?: string;
  onTransferTypeFilterChange?: (value: string) => void;
  collections?: string[];
}

export default function OwnershipTableFilter({
  searchValue = "",
  onSearchChange,
  statusFilter = "all",
  onStatusFilterChange,
  collectionFilter = "all",
  onCollectionFilterChange,
  transferTypeFilter = "all",
  onTransferTypeFilterChange,
  collections = [],
}: OwnershipTableFilterProps) {
  return (
    <div className="bg-[#F9F9FA] mb-[16px] rounded-lg p-3 px-[16px] min-h-18.25 flex flex-wrap items-center justify-between gap-4">
      <div className="relative flex-1 min-w-60 max-w-md bg-white flex items-center rounded-md">
        <label
          htmlFor="ownership-search"
          className="absolute inset-s-3 top-1/2 z-10 -translate-y-1/2 cursor-text"
        >
          <Search className="size-4 text-neutral-400" />
        </label>

        <Input
          id="ownership-search"
          placeholder="Search by piece, owner, serial, collection..."
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="ps-10 h-11 border-neutral-200"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Status Dropdown */}
          <Select
            value={statusFilter}
            onValueChange={(val) => onStatusFilterChange?.(val)}
          >
            <SelectTrigger className="h-11 w-34 bg-white border-neutral-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="OWNED">Owned</SelectItem>
              <SelectItem value="IN_TRANSFER">In Transfer</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
            </SelectContent>
          </Select>

          {/* Collection Dropdown */}
          <Select
            value={collectionFilter}
            onValueChange={(val) => onCollectionFilterChange?.(val)}
          >
            <SelectTrigger className="h-11 w-40 bg-white border-neutral-200">
              <SelectValue placeholder="Collection" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Collections</SelectItem>
              {collections.map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Transfer Type Dropdown */}
          <Select
            value={transferTypeFilter}
            onValueChange={(val) => onTransferTypeFilterChange?.(val)}
          >
            <SelectTrigger className="h-11 w-40 bg-white border-neutral-200">
              <SelectValue placeholder="Transfer Type" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Transfer Types</SelectItem>
              <SelectItem value="DIRECT">Direct Purchase</SelectItem>
              <SelectItem value="SECONDARY">Secondary Market</SelectItem>
              <SelectItem value="GIFT">Gift</SelectItem>
              <SelectItem value="INHERITED">Inherited</SelectItem>
              <SelectItem value="NONE">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
