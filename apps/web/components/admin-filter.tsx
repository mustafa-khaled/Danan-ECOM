"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface AdminFilterProps {
  paramName: string;
  label: string;
  options: { value: string; label: string }[];
  includeAll?: boolean;
}

export function AdminFilter({ paramName, label, options, includeAll = true }: AdminFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const current = searchParams.get(paramName) ?? "";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(paramName, value);
      params.delete("page");
    } else {
      params.delete(paramName);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={`filter-${paramName}`}
        className="text-xs tracking-[0.1em] uppercase text-[var(--color-ivory-muted)]"
      >
        {label}:
      </label>
      <select
        id={`filter-${paramName}`}
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
      >
        {includeAll && <option value="">All</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
