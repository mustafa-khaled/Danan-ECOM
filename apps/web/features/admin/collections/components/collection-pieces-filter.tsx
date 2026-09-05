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

interface CollectionPiecesFilterProps {
  collectionId?: string;
  collectionName?: string;
}

export default function CollectionPiecesFilter({
  collectionId,
  collectionName,
}: CollectionPiecesFilterProps) {
  return (
    <div className="bg-[#F9F9FA] rounded-lg p-3 px-[16px] h-18.25 flex justify-between gap-[32px]">
      <div className="relative w-150.5 bg-white flex items-center">
        <label
          htmlFor="pieces-search"
          className="absolute inset-s-3 top-1/2 z-10 -translate-y-1/2 cursor-text"
        >
          <Search className="size-4 text-neutral-500" />
        </label>

        <Input
          id="pieces-search"
          placeholder="Search pieces by name or serial..."
          className="ps-10"
        />
      </div>

      <div className="flex items-center gap-[16px]">
        <div className="grid grid-cols-3 gap-2">
          {/* Status Dropdown */}
          <Select>
            <SelectTrigger className="h-12.25 w-35">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="owned">Owned</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="vaulted">Vaulted</SelectItem>
            </SelectContent>
          </Select>

          {/* Collection Dropdown */}
          <Select defaultValue={collectionId || "current"}>
            <SelectTrigger className="h-12.25 w-35">
              <SelectValue placeholder="Collection" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value={collectionId || "current"}>
                {collectionName || "Current"}
              </SelectItem>
              <SelectItem value="all">All Collections</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Dropdown */}
          <Select>
            <SelectTrigger className="h-12.25 w-35">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="ring">Ring</SelectItem>
              <SelectItem value="necklace">Necklace</SelectItem>
              <SelectItem value="bracelet">Bracelet</SelectItem>
              <SelectItem value="earrings">Earrings</SelectItem>
              <SelectItem value="pendant">Pendant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
