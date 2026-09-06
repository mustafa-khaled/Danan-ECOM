import { AdminLayout } from "@/components/admin/layout";
import { ConfirmProvider } from "@/components/confirm-dialog";
import { requireAdminSession } from "@/features/auth/server/admin-session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminSession();

  return (
    <AdminLayout admin={admin}>
      <ConfirmProvider>{children}</ConfirmProvider>
    </AdminLayout>
  );
}
