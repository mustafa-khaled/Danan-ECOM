import { ClientProvider } from "@/shared/providers/client-context";
import { requireClientSession } from "@/features/auth/server/session";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireClientSession();

  return (
    <div data-theme="client" className="min-h-dvh">
      <ClientProvider
        value={{
          clientId: profile.id,
          displayName: profile.displayName,
          visibilityGroups: profile.visibilityGroups,
        }}
      >
        {children}
      </ClientProvider>
    </div>
  );
}
