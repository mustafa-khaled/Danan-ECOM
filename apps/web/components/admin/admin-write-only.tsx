"use client";

import type { ReactNode } from "react";
import { useAdmin } from "@/shared/providers/admin-context";

/**
 * Renders write affordances only for roles that can actually write.
 *
 * Client components can read `canWrite` from `useAdmin()` directly; this exists
 * for the server-rendered admin pages, which have no hooks.
 */
export function AdminWriteOnly({ children }: { children: ReactNode }) {
  const { canWrite } = useAdmin();
  return canWrite ? <>{children}</> : null;
}
