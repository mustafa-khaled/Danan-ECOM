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
import type {
  PaymentStatusFilter,
  PaymentAmountFilter,
  PaymentMethodFilter,
} from "../types";

interface PaymentsTableFilterProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: PaymentStatusFilter;
  onStatusFilterChange?: (value: string) => void;
  amountFilter?: PaymentAmountFilter;
  onAmountFilterChange?: (value: string) => void;
  methodFilter?: PaymentMethodFilter;
  onMethodFilterChange?: (value: string) => void;
}

export default function PaymentsTableFilter({
  searchValue = "",
  onSearchChange,
  statusFilter = "all",
  onStatusFilterChange,
  amountFilter = "all",
  onAmountFilterChange,
  methodFilter = "all",
  onMethodFilterChange,
}: PaymentsTableFilterProps) {
  return (
    <div className="bg-[#F9F9FA] rounded-lg p-3 px-[16px] min-h-18.25 flex flex-wrap items-center justify-between gap-4">
      <div className="relative flex-1 min-w-60 max-w-md bg-white flex items-center rounded-md">
        <label
          htmlFor="payments-search"
          className="absolute inset-s-3 top-1/2 z-10 -translate-y-1/2 cursor-text"
        >
          <Search className="size-4 text-neutral-400" />
        </label>

        <Input
          id="payments-search"
          placeholder="Search by transaction, member..."
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="ps-10 h-11 border-neutral-200"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(val) => onStatusFilterChange?.(val)}
        >
          <SelectTrigger className="h-11 w-34 bg-white border-neutral-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={amountFilter}
          onValueChange={(val) => onAmountFilterChange?.(val)}
        >
          <SelectTrigger className="h-11 w-38 bg-white border-neutral-200">
            <SelectValue placeholder="Amount" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Amounts</SelectItem>
            <SelectItem value="under500">Under 500 SAR</SelectItem>
            <SelectItem value="500-1000">500 - 1,000 SAR</SelectItem>
            <SelectItem value="over1000">Over 1,000 SAR</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={methodFilter}
          onValueChange={(val) => onMethodFilterChange?.(val)}
        >
          <SelectTrigger className="h-11 w-38 bg-white border-neutral-200">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="CARD">Card</SelectItem>
            <SelectItem value="MADA">Mada</SelectItem>
            <SelectItem value="APPLE_PAY">Apple Pay</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
