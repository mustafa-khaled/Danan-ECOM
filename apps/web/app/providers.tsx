"use client";

import { type ReactNode } from "react";
import { QueryProvider } from "@/shared/providers/query-provider";
import { SessionHandler } from "@/shared/providers/session-handler";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <SessionHandler>{children}</SessionHandler>
    </QueryProvider>
  );
}
