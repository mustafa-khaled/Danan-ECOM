import { StatusPill, SerialBadge } from "@/components/ui";
import { AdminPagination } from "@/components/admin-pagination";
import { fetchAdminCertificates } from "@/features/admin/api/fetch-admin-certificates";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ADMIN_PAGE_SIZE, parseAdminPage } from "@/shared/lib/parse-admin-page";
import { RegenerateButton } from "./regenerate-button";

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parseAdminPage(pageParam);
  const cookieHeader = await getAdminCookieHeader();
  const { items, total } = await fetchAdminCertificates(page, ADMIN_PAGE_SIZE, cookieHeader);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-[0.06em] uppercase">Certificates</h1>
        <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
          {total} {total === 1 ? "certificate" : "certificates"} issued
        </p>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">List of all issued certificates</caption>
          <thead className="border-b border-[var(--color-border)] text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
            <tr>
              <th className="px-4 py-3 font-normal">Certificate #</th>
              <th className="px-4 py-3 font-normal">Serial</th>
              <th className="px-4 py-3 font-normal">Design</th>
              <th className="px-4 py-3 font-normal">Owner</th>
              <th className="px-4 py-3 font-normal">Issued</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {items.map((cert) => (
              <tr key={cert.id}>
                <td className="px-4 py-4 font-mono text-xs">{cert.certificateNumber}</td>
                <td className="px-4 py-4">
                  <SerialBadge serial={cert.piece.serialNumber} />
                </td>
                <td className="px-4 py-4">{cert.piece.design.name}</td>
                <td className="px-4 py-4">{cert.owner?.displayName ?? "—"}</td>
                <td className="px-4 py-4 text-[var(--color-ivory-muted)]">
                  {new Date(cert.issuedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-4">
                  <StatusPill status={cert.isActive ? "Active" : "Archived"} />
                </td>
                <td className="px-4 py-4">
                  <RegenerateButton pieceId={cert.piece.serialNumber} certificateId={cert.id} />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-ivory-muted)]">
                  No certificates have been issued yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        basePath="/admin/certificates"
        page={page}
        limit={ADMIN_PAGE_SIZE}
        total={total}
      />
    </div>
  );
}
