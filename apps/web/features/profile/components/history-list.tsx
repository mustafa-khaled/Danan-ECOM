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
      if (isNaN(d.getTime())) return "--:--";
      const timeString = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return timeString;
    } catch {
      return "--:--";
    }
  };

  return (
    <div className="space-y-6">
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger
          className="flex w-full items-center justify-between sm:max-w-[50%] rounded-(--radius-md) bg-ds-surface px-4 py-3 sm:px-5 font-bold text-base text-ds-text shadow-none outline-none transition-colors hover:bg-ds-surface-warm cursor-pointer [&_svg]:size-5 [&_svg]:text-ds-text [&_svg]:opacity-100"
          aria-label="Filter timeline"
        >
          <SelectValue placeholder="This Week" />
        </SelectTrigger>

        <SelectContent className="z-(--z-popover) w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width) overflow-hidden rounded-(--radius-md) border border-ds-border bg-ds-background p-1.5 shadow-lg">
          <SelectItem
            value="this-week"
            className="cursor-pointer font-medium text-ds-text"
          >
            This Week
          </SelectItem>
          <SelectItem
            value="this-month"
            className="cursor-pointer font-medium text-ds-text"
          >
            This Month
          </SelectItem>
          <SelectItem
            value="this-year"
            className="cursor-pointer font-medium text-ds-text"
          >
            This Year
          </SelectItem>
          <SelectItem
            value="all"
            className="cursor-pointer font-medium text-ds-text"
          >
            All History
          </SelectItem>
        </SelectContent>
      </Select>

      {/* History Events List */}
      {filteredEvents.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          {filteredEvents.map((event) => (
            <Link
              key={event.id}
              href={`/beta/profile/wardrobe/${event.pieceId}`}
              className="group block rounded-lg p-4 sm:p-5 bg-ds-surface-warm border border-ds-border-light transition-shadow hover:shadow-md"
            >
              <h3 className="font-bold text-base text-ds-text tracking-tight uppercase font-body">
                {event.type === "OWNED" || event.type === "ISSUED"
                  ? "OWNERSHIP CERTIFICATE"
                  : event.type.replace(/_/g, " ").toUpperCase()}
              </h3>
              <p className="mt-2 text-xs sm:text-sm font-medium uppercase text-ds-text-secondary font-body">
                {event.pieceName}
              </p>
              <p className="mt-2 text-caption sm:text-xs uppercase text-ds-text-muted font-body">
                {formatTime(event.date)}
              </p>
              <div className="mt-4 sm:mt-5 flex items-center justify-between">
                <span className="text-sm sm:text-base font-medium text-ds-primary">
                  View Certificate
                </span>
                <ArrowRight
                  className="w-4 h-4 sm:w-5 sm:h-5 text-ds-primary transition-transform group-hover:translate-x-1"
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
