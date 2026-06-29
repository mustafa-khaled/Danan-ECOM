import { ClientProvider } from "../../lib/client-context";
import { requireClientSession } from "../../lib/session";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireClientSession();

  return (
    <ClientProvider
      value={{
        clientId: profile.id,
        displayName: profile.displayName,
        visibilityGroups: profile.visibilityGroups,
      }}
    >
      {children}
    </ClientProvider>
  );
}
