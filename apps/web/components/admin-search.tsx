"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

interface AdminSearchProps {
  placeholder?: string;
  paramName?: string;
}

export function AdminSearch({ placeholder = "Search...", paramName = "q" }: AdminSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get(paramName) ?? "");

  const handleSearch = useCallback(
    (term: string) => {
      setValue(term);
      const params = new URLSearchParams(searchParams.toString());
      if (term) {
        params.set(paramName, term);
        params.delete("page");
      } else {
        params.delete(paramName);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams, paramName],
  );

  return (
    <div className="relative">
      <input
        type="search"
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full max-w-sm rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-ivory-muted)] focus:border-[var(--color-accent)] focus:outline-none"
      />
      {isPending && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-ivory-muted)]">
          ...
        </span>
      )}
    </div>
  );
}
