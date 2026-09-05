"use client";

import { Input } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, MoveDown, Plus, Search } from "lucide-react";
import Link from "next/link";

interface MembersTableFilterProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  classFilter?: string;
  onClassFilterChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  houseKeyFilter?: string;
  onHouseKeyFilterChange?: (value: string) => void;
  onDownload?: () => void;
}

export default function MembersTableFilter({
  searchValue = "",
  onSearchChange,
  classFilter = "all",
  onClassFilterChange,
  statusFilter = "all",
  onStatusFilterChange,
  houseKeyFilter = "all",
  onHouseKeyFilterChange,
  onDownload,
}: MembersTableFilterProps) {
  return (
    <div className="bg-[#F9F9FA] rounded-lg p-3 px-[16px] min-h-18.25 flex flex-wrap items-center justify-between gap-4">
      <div className="relative flex-1 min-w-60 max-w-md bg-white flex items-center rounded-md">
        <label
          htmlFor="members-search"
          className="absolute inset-s-3 top-1/2 z-10 -translate-y-1/2 cursor-text"
        >
          <Search className="size-4 text-neutral-400" />
        </label>

        <Input
          id="members-search"
          placeholder="Search members by name, cell or email..."
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="ps-10 h-11 border-neutral-200"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Select
            value={classFilter}
            onValueChange={(val) => onClassFilterChange?.(val)}
          >
            <SelectTrigger className="h-11 w-32 bg-white border-neutral-200">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="Class A">Class A</SelectItem>
              <SelectItem value="Class B">Class B</SelectItem>
              <SelectItem value="Class C">Class C</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(val) => onStatusFilterChange?.(val)}
          >
            <SelectTrigger className="h-11 w-32 bg-white border-neutral-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={houseKeyFilter}
            onValueChange={(val) => onHouseKeyFilterChange?.(val)}
          >
            <SelectTrigger className="h-11 w-34 bg-white border-neutral-200">
              <SelectValue placeholder="House Key" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Keys</SelectItem>
              <SelectItem value="active">Active Key</SelectItem>
              <SelectItem value="inactive">No Key</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDownload}
            className="w-37.5 h-12.25 text-body-lg font-semibold flex items-center justify-center gap-[16px] px-3 text-warm-900 bg-warm-500 hover:opacity-90 transition-opacity"
          >
            Download
            <MoveDown className="size-5" />
          </button>
          <Link href="/admin/members/new">
            <button
              type="button"
              className="w-58 h-12.25 text-body-lg font-semibold flex items-center justify-center gap-[16px] px-3 text-teal-900 bg-[#4CBEAE] hover:opacity-90 transition-opacity"
            >
              Add Member
              <Plus className="size-5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
