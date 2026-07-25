"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { setUnauthorizedHandler } from "@/shared/lib/unauthorized-handler";

export function SessionHandler({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.clear();
      const path = window.location.pathname;
      window.location.href = path.startsWith("/admin") ? "/admin/login" : "/beta";
    });

    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  return children;
}
