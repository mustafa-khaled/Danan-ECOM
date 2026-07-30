import Link from "next/link";
import { AdminLayout } from "@/components/ui";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { ConfirmProvider } from "@/components/confirm-dialog";
import { requireAdminSession } from "@/features/auth/server/admin-session";
import { getAdminNavItems } from "@/shared/lib/admin-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminSession();
  const navItems = getAdminNavItems(admin.role);

  return (
    <AdminLayout title="DADAN Admin">
      <div className="mb-8 flex flex-col gap-4 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Admin">
          <ul className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-[var(--radius-item)] border border-transparent px-4 text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)] transition-colors hover:border-[var(--color-border)] hover:text-[var(--color-gold)] focus-visible:shadow-[var(--shadow-focus)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-4">
          <div className="text-end">
            <p className="text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
              {admin.displayName} · {admin.role.replace("_", " ")}
            </p>
            {admin.role === "VIEWER" ? (
              <p className="text-[0.65rem] tracking-[0.1em] uppercase text-[var(--color-gold)]">
                Read-only access
              </p>
            ) : null}
          </div>
          <AdminLogoutButton />
        </div>
      </div>
      <ConfirmProvider>
        {children}
      </ConfirmProvider>
    </AdminLayout>
  );
}
