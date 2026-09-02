"use client";

import { useCallback, useMemo, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════════════
   usePagination — URL-based pagination hook
   ═══════════════════════════════════════════════════════════════════════════
   Manages page, per_page, search, sort and arbitrary filter params
   entirely through the URL. Navigation uses router.replace + useTransition
   so isPending flips to true during the in-flight route change.

   Usage:
     const { params, isPending, buildPageUrl, setSearch, setPerPage } =
       usePagination({ scrollToTop: true });
   ═══════════════════════════════════════════════════════════════════════════ */

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

export interface PaginationParams {
  page: number;
  per_page: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  [key: string]: unknown;
}

export interface PageInfo {
  from: number;
  to: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  /** Window of page numbers around the current page */
  pageNumbers: number[];
}

export interface UsePaginationOptions {
  /** Page URL param name (default: "page") */
  paramName?: string;
  /** Per-page URL param name (default: "per_page") */
  perPageParamName?: string;
  /** Scroll to top on navigation (default: true) */
  scrollToTop?: boolean;
  /** Number of sibling pages to include in pageNumbers (default: 1) */
  siblingCount?: number;
}

export interface UsePaginationReturn {
  params: PaginationParams;
  isPending: boolean;
  goToPage: (page: number) => void;
  goToNextPage: (lastPage: number) => void;
  goToPrevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: (lastPage: number) => void;
  setSearch: (search: string) => void;
  setPerPage: (perPage: number) => void;
  setSort: (by: string, order: "asc" | "desc") => void;
  setFilters: (filters: Record<string, unknown>) => void;
  clearFilters: () => void;
  buildPageUrl: (page: number) => string;
  getPageInfo: (total: number, pageSize: number) => PageInfo;
  resetAll: () => void;
}

export function usePagination({
  paramName = "page",
  perPageParamName = "per_page",
  scrollToTop = true,
  siblingCount = 1,
}: UsePaginationOptions = {}): UsePaginationReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  /* ── Parse current URL params ─────────────────────────────────────────── */

  const params = useMemo((): PaginationParams => {
    const rawPage = parseInt(searchParams.get(paramName) ?? "", 10);
    const rawPerPage = parseInt(searchParams.get(perPageParamName) ?? "", 10);

    const base: PaginationParams = {
      page: Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : DEFAULT_PAGE,
      per_page:
        Number.isFinite(rawPerPage) && rawPerPage >= 1
          ? rawPerPage
          : DEFAULT_PAGE_SIZE,
      search: searchParams.get("search") ?? undefined,
      sort_by: searchParams.get("sort_by") ?? undefined,
      sort_order:
        (searchParams.get("sort_order") as "asc" | "desc") ?? undefined,
    };

    /* forward any extra filter params */
    const reserved = new Set([
      paramName,
      perPageParamName,
      "search",
      "sort_by",
      "sort_order",
    ]);
    searchParams.forEach((value, key) => {
      if (!reserved.has(key)) base[key] = value;
    });

    return base;
  }, [searchParams, paramName, perPageParamName]);

  /* ── URL builder ──────────────────────────────────────────────────────── */

  const buildUrl = useCallback(
    (newParams: PaginationParams): string => {
      const parts: string[] = [];

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        if (key === paramName && value === DEFAULT_PAGE) return;
        if (key === perPageParamName && value === DEFAULT_PAGE_SIZE) return;
        parts.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
        );
      });

      return parts.length > 0 ? `${pathname}?${parts.join("&")}` : pathname;
    },
    [pathname, paramName, perPageParamName],
  );

  const navigate = useCallback(
    (newParams: PaginationParams) => {
      const url = buildUrl(newParams);
      startTransition(() => {
        router.replace(url, { scroll: scrollToTop });
      });
    },
    [buildUrl, router, scrollToTop],
  );

  /* ── Navigation helpers ───────────────────────────────────────────────── */

  const goToPage = useCallback(
    (page: number) => navigate({ ...params, page: Math.max(1, page) }),
    [params, navigate],
  );

  const goToNextPage = useCallback(
    (lastPage: number) => {
      if (params.page < lastPage) navigate({ ...params, page: params.page + 1 });
    },
    [params, navigate],
  );

  const goToPrevPage = useCallback(() => {
    if (params.page > 1) navigate({ ...params, page: params.page - 1 });
  }, [params, navigate]);

  const goToFirstPage = useCallback(
    () => navigate({ ...params, page: 1 }),
    [params, navigate],
  );

  const goToLastPage = useCallback(
    (lastPage: number) => navigate({ ...params, page: lastPage }),
    [params, navigate],
  );

  const setSearch = useCallback(
    (search: string) =>
      navigate({ ...params, search: search || undefined, page: 1 }),
    [params, navigate],
  );

  const setPerPage = useCallback(
    (perPage: number) => navigate({ ...params, per_page: perPage, page: 1 }),
    [params, navigate],
  );

  const setSort = useCallback(
    (sort_by: string, sort_order: "asc" | "desc") =>
      navigate({ ...params, sort_by, sort_order }),
    [params, navigate],
  );

  const setFilters = useCallback(
    (filters: Record<string, unknown>) =>
      navigate({ ...params, ...filters, page: 1 }),
    [params, navigate],
  );

  const clearFilters = useCallback(
    () => navigate({ page: params.page, per_page: params.per_page }),
    [params.page, params.per_page, navigate],
  );

  const buildPageUrl = useCallback(
    (page: number) => buildUrl({ ...params, page }),
    [params, buildUrl],
  );

  const resetAll = useCallback(
    () => router.replace(pathname, { scroll: scrollToTop }),
    [router, pathname, scrollToTop],
  );

  /* ── Page info computation ────────────────────────────────────────────── */

  const getPageInfo = useCallback(
    (total: number, pageSize: number): PageInfo => {
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const current = Math.min(params.page, totalPages);
      const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
      const to = Math.min(current * pageSize, total);

      /* build sibling window */
      const left = Math.max(2, current - siblingCount);
      const right = Math.min(totalPages - 1, current + siblingCount);
      const pageNumbers: number[] = [];
      for (let p = left; p <= right; p++) pageNumbers.push(p);

      return {
        from,
        to,
        totalPages,
        hasNextPage: current < totalPages,
        hasPrevPage: current > 1,
        pageNumbers,
      };
    },
    [params.page, siblingCount],
  );

  return {
    params,
    isPending,
    goToPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    setSearch,
    setPerPage,
    setSort,
    setFilters,
    clearFilters,
    buildPageUrl,
    getPageInfo,
    resetAll,
  };
}
