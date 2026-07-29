import { fetchAdminCollections } from "@/features/admin/api/fetch-admin-collections";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { DesignForm } from "../design-form";

export default async function NewDesignPage() {
  const cookieHeader = await getAdminCookieHeader();
  const { items: collections } = await fetchAdminCollections(1, 100, cookieHeader);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl tracking-[0.06em] uppercase">
        Create Design
      </h1>
      <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <DesignForm collections={collections} mode="create" />
      </div>
    </div>
  );
}
