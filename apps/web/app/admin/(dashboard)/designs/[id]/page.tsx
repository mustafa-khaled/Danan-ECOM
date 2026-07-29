import { notFound } from "next/navigation";
import { fetchAdminDesignDetail, fetchAdminCollections } from "@/features/admin/api/fetch-admin-collections";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { DesignForm } from "../design-form";

interface EditDesignPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDesignPage({ params }: EditDesignPageProps) {
  const { id } = await params;
  const cookieHeader = await getAdminCookieHeader();

  let design;
  try {
    design = await fetchAdminDesignDetail(id, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const { items: collections } = await fetchAdminCollections(1, 100, cookieHeader);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl tracking-[0.06em] uppercase">
        Edit Design
      </h1>
      <p className="text-sm text-[var(--color-ivory-muted)]">
        {design.name} · {design.material}
      </p>
      <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <DesignForm design={design} collections={collections} mode="edit" />
      </div>
    </div>
  );
}
