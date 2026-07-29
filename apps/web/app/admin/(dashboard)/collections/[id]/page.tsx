import { notFound } from "next/navigation";
import { fetchAdminCollectionDetail } from "@/features/admin/api/fetch-admin-collections";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { CollectionForm } from "../collection-form";

interface EditCollectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({ params }: EditCollectionPageProps) {
  const { id } = await params;
  const cookieHeader = await getAdminCookieHeader();

  let collection;
  try {
    collection = await fetchAdminCollectionDetail(id, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl tracking-[0.06em] uppercase">
        Edit Collection
      </h1>
      <p className="text-sm text-[var(--color-ivory-muted)]">
        {collection.name} · {collection.designCount} design{collection.designCount === 1 ? "" : "s"}
      </p>
      <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <CollectionForm collection={collection} mode="edit" />
      </div>
    </div>
  );
}
