"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface HistoryEvent {
  id: string;
  pieceName: string;
  pieceId: string;
  date: string;
  type: string;
}

interface HistoryListProps {
  events: HistoryEvent[];
  emptyTitle: string;
  emptyDescription: string;
}

export function HistoryList({
  events,
  emptyTitle,
  emptyDescription,
}: HistoryListProps) {
  const [filter, setFilter] = useState<string>("this-week");

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;

    const now = new Date();
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      if (isNaN(eventDate.getTime())) return true;

      const diffTime = Math.abs(now.getTime() - eventDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (filter === "this-week") return diffDays <= 7;
      if (filter === "this-month") return diffDays <= 30;
      if (filter === "this-year") return diffDays <= 365;
      return true;
    });
  }, [events, filter]);

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "09:42 AM";
      const timeString = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return timeString;
    } catch {
      return "09:42 AM";
    }
  };

  return (
    <div className="space-y-6">
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger
          className="flex w-full items-center justify-between sm:max-w-[50%] rounded-xl bg-[#F1F3F5] px-4 py-3.5 sm:px-5 font-bold text-base sm:text-lg text-[#1E293B] shadow-none outline-none transition-colors hover:bg-[#E5E8EB] cursor-pointer [&_svg]:size-5 [&_svg]:text-[#1E293B] [&_svg]:opacity-100"
          aria-label="Filter timeline"
        >
          <SelectValue placeholder="This Week" />
        </SelectTrigger>

        <SelectContent className="z-50 w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width) overflow-hidden rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg">
          <SelectItem
            value="this-week"
            className="cursor-pointer font-medium text-[#1E293B]"
          >
            This Week
          </SelectItem>
          <SelectItem
            value="this-month"
            className="cursor-pointer font-medium text-[#1E293B]"
          >
            This Month
          </SelectItem>
          <SelectItem
            value="this-year"
            className="cursor-pointer font-medium text-[#1E293B]"
          >
            This Year
          </SelectItem>
          <SelectItem
            value="all"
            className="cursor-pointer font-medium text-[#1E293B]"
          >
            All History
          </SelectItem>
        </SelectContent>
      </Select>

      {/* History Events List matching Image 1 */}
      {filteredEvents.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredEvents.map((event) => (
            <Link
              key={event.id}
              href={`/beta/profile/wardrobe/${event.pieceId}`}
              className="group block rounded-lg p-3 sm:p-4 transition-shadow hover:shadow-sm"
              style={{ backgroundColor: "var(--Contessa-50, #FBF7F7)" }}
            >
              <h3 className="font-bold text-base sm:text-lg text-[#1E293B] tracking-tight uppercase">
                {event.type === "OWNED" || event.type === "ISSUED"
                  ? "OWNERSHIP CERTIFICATE"
                  : event.type.replace(/_/g, " ").toUpperCase()}
              </h3>
              <p className="mt-2 text-xs sm:text-sm font-medium uppercase text-[#525866]">
                {event.pieceName}
              </p>
              <p className="mt-2 text-[11px] sm:text-xs uppercase text-[#667085]">
                {formatTime(event.date)}
              </p>
              <div className="mt-4 sm:mt-5 flex items-center justify-between">
                <span className="text-sm sm:text-base font-medium text-[#BC776E]">
                  View Certificate
                </span>
                <ArrowRight
                  className="w-4 h-4 sm:w-5 sm:h-5 text-[#BC776E] transition-transform group-hover:translate-x-1"
                  strokeWidth={1.5}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
