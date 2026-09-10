"use client";

import { Input } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoveDown, Plus, Search } from "lucide-react";
import Link from "next/link";

interface CollectionAccessFilterProps {
  collectionId?: string;
}

export default function CollectionAccessFilter({}: CollectionAccessFilterProps) {
  return (
    <div className="bg-[#F9F9FA] rounded-lg p-3 px-[16px] h-18.25 flex justify-between gap-[32px]">
      <div className="relative w-150.5 bg-white flex items-center">
        <label
          htmlFor="access-search"
          className="absolute inset-s-3 top-1/2 z-10 -translate-y-1/2 cursor-text"
        >
          <Search className="size-4 text-neutral-500" />
        </label>

        <Input
          id="access-search"
          placeholder="Search members by name, email, or key..."
          className="ps-10"
        />
      </div>

      <div className="flex items-center gap-[16px]">
        <div className="grid grid-cols-3 gap-2">
          {/* Class Dropdown */}
          <Select>
            <SelectTrigger className="h-12.25 w-35">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="class-a">Class A</SelectItem>
              <SelectItem value="class-b">Class B</SelectItem>
              <SelectItem value="class-c">Class C</SelectItem>
              <SelectItem value="private-client">Private Client</SelectItem>
            </SelectContent>
          </Select>

          {/* Access Status Dropdown */}
          <Select>
            <SelectTrigger className="h-12.25 w-35">
              <SelectValue placeholder="Access Status" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="granted">Granted</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>

          {/* House Key Dropdown */}
          <Select>
            <SelectTrigger className="h-12.25 w-35">
              <SelectValue placeholder="House Key" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Keys</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className="w-37.5 h-12.25 text-body-lg font-semibold flex items-center justify-center gap-[16px] px-3 text-warm-900 bg-warm-500 hover:opacity-90 transition-opacity"
          >
            Download
            <MoveDown className="size-5" />
          </button>
          <Link href="/admin/clients/new">
            <button
              type="button"
              className="w-58 h-12.25 text-body-lg font-semibold flex items-center justify-center gap-[16px] px-3 text-teal-900 bg-[#4CBEAE] hover:opacity-90 transition-opacity"
            >
              Invite Member
              <Plus className="size-5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
