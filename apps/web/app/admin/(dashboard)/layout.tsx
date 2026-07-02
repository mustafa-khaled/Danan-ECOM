import Link from "next/link";
import { AdminLayout } from "@dadan/ui";
import { AdminLogoutButton } from "../../../components/admin-logout-button";
import { requireAdminSession } from "../../../lib/session/admin";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/pieces", label: "Pieces" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/transfers", label: "Transfers" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminSession();

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
          <p className="text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
            {admin.displayName} · {admin.role.replace("_", " ")}
          </p>
          <AdminLogoutButton />
        </div>
      </div>
      {children}
    </AdminLayout>
  );
}
