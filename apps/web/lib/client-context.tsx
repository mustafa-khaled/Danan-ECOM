"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface ClientContextValue {
  clientId: string;
  displayName: string;
  visibilityGroups: string[];
}

const ClientContext = createContext<ClientContextValue | null>(null);

export function ClientProvider({
  value,
  children,
}: {
  value: ClientContextValue;
  children: ReactNode;
}) {
  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

export function useClientContext(): ClientContextValue {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClientContext must be used within ClientProvider");
  }
  return context;
}
