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

export default function CollectionsTableFilter() {
  return (
    <div className="bg-[#F9F9FA] rounded-lg p-3 px-[16px] h-18.25 flex justify-between gap-[32px]">
      <div className="relative w-150.5 bg-white flex items-center">
        <label
          htmlFor="collections-search"
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 cursor-text"
        >
          <Search className="size-4 text-neutral-500" />
        </label>

        <Input
          id="collections-search"
          placeholder="Search collections"
          className="pl-10"
        />
      </div>

      <div className="flex items-center gap-[16px]">
        <div className="grid grid-cols-3 gap-2">
          <Select>
            <SelectTrigger className="h-12.25 w-35">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem
                value="en"
                className="font-['Poppins',sans-serif] font-normal leading-none text-center"
              >
                One
              </SelectItem>
              <SelectItem
                value="ar"
                className="font-['Poppins',sans-serif] font-normal leading-none text-center"
              >
                Two
              </SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="h-12.25 w-35">
              <SelectValue placeholder="Access" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem
                value="en"
                className="font-['Poppins',sans-serif] font-normal leading-none text-center"
              >
                One
              </SelectItem>
              <SelectItem
                value="ar"
                className="font-['Poppins',sans-serif] font-normal leading-none text-center"
              >
                Two
              </SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="h-12.25 w-35">
              <SelectValue placeholder="Sorted By" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem
                value="en"
                className="font-['Poppins',sans-serif] font-normal leading-none text-center"
              >
                One
              </SelectItem>
              <SelectItem
                value="ar"
                className="font-['Poppins',sans-serif] font-normal leading-none text-center"
              >
                Two
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-3">
          <button className="w-37.5 h-12.25 text-body-lg font-semibold flex items-center justify-center gap-[16px] px-3 text-warm-900 bg-warm-500">
            Download
            <MoveDown className="size-5" />
          </button>
          <Link href="/admin/collections/new">
            <button className="w-58 h-12.25 text-body-lg font-semibold flex items-center justify-center gap-[16px] px-3 text-teal-900 bg-[#4CBEAE]">
              Add New Collection
              <Plus className="size-5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
