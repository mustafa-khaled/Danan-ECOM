import { ClientProvider } from "@/shared/providers/client-context";
import { requireClientSession } from "@/features/auth/server/session";
import { SiteFooter, SiteHeader } from "@/components/ui";

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
        <div className="flex min-h-dvh w-full flex-col overflow-x-clip bg-white text-(--color-text)">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </ClientProvider>
    </div>
  );
}
