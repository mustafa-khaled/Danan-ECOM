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

interface OperationsTableFilterProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  transferFilter?: string;
  onTransferFilterChange?: (value: string) => void;
  typeFilter?: string;
  onTypeFilterChange?: (value: string) => void;
}

export default function OperationsTableFilter({
  searchValue = "",
  onSearchChange,
  statusFilter = "all",
  onStatusFilterChange,
  transferFilter = "all",
  onTransferFilterChange,
  typeFilter = "all",
  onTypeFilterChange,
}: OperationsTableFilterProps) {
  return (
    <div className="bg-[#F9F9FA] mb-[16px] rounded-lg p-3 px-[16px] min-h-18.25 flex flex-wrap items-center justify-between gap-4">
      <div className="relative flex-1 min-w-60 max-w-md bg-white flex items-center rounded-md">
        <label
          htmlFor="operations-search"
          className="absolute inset-s-3 top-1/2 z-10 -translate-y-1/2 cursor-text"
        >
          <Search className="size-4 text-neutral-400" />
        </label>

        <Input
          id="operations-search"
          placeholder="Search operations by ID, title, member, piece..."
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
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Transfers Dropdown */}
          <Select
            value={transferFilter}
            onValueChange={(val) => onTransferFilterChange?.(val)}
          >
            <SelectTrigger className="h-11 w-34 bg-white border-neutral-200">
              <SelectValue placeholder="Transfers" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Transfers</SelectItem>
              <SelectItem value="INCOMING">Incoming</SelectItem>
              <SelectItem value="OUTGOING">Outgoing</SelectItem>
              <SelectItem value="INTERNAL">Internal</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Dropdown */}
          <Select
            value={typeFilter}
            onValueChange={(val) => onTypeFilterChange?.(val)}
          >
            <SelectTrigger className="h-11 w-44 bg-white border-neutral-200">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="PIECE_TRANSFER">Piece Transfer</SelectItem>
              <SelectItem value="ACCESS_REQUEST">Access Request</SelectItem>
              <SelectItem value="MEMBERSHIP_UPGRADE">
                Membership Upgrade
              </SelectItem>
              <SelectItem value="KEY_ISSUANCE">Key Issuance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
