import { AdminLayout } from "@/components/ui";
import { ConfirmProvider } from "@/components/confirm-dialog";
import { requireAdminSession } from "@/features/auth/server/admin-session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminSession();

  return (
    <AdminLayout admin={admin} title="Collections">
      <ConfirmProvider>
        {children}
      </ConfirmProvider>
    </AdminLayout>
  );
}
