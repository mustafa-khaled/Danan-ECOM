import { AdminLayout } from "@/components/admin/layout";
import { AdminAccessGuard } from "@/components/admin/admin-access-guard";
import { ConfirmProvider } from "@/components/confirm-dialog";
import {
  requireAdminSession,
  getAdminCookieHeader,
} from "@/features/auth/server/admin-session";
import { fetchAdminOperationsStats } from "@/features/admin/api/fetch-admin-operations";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminSession();
  const cookieHeader = await getAdminCookieHeader();
  const stats = await fetchAdminOperationsStats(cookieHeader).catch(() => ({
    pending: 0,
  }));

  return (
    <AdminLayout admin={admin} pendingCount={stats.pending}>
      <ConfirmProvider>
        <AdminAccessGuard>{children}</AdminAccessGuard>
      </ConfirmProvider>
    </AdminLayout>
  );
}
