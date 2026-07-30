import { notFound } from "next/navigation";
import { fetchAdminClientDetail } from "@/features/admin/api/fetch-admin-clients";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ApiError } from "@/shared/lib/send-request";
import { ClientForm } from "../client-form";
import { ClientActions } from "./client-actions";

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;
  const cookieHeader = await getAdminCookieHeader();

  let client;
  try {
    client = await fetchAdminClientDetail(id, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-[0.06em] uppercase">Edit Client</h1>
          <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
            {client.displayName} · {client.email}
          </p>
        </div>
      </div>

      <ClientForm client={client} mode="edit" />

      <ClientActions clientId={client.id} isActive={client.isActive} />
    </div>
  );
}
