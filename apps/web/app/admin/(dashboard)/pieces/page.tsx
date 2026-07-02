import { SerialBadge, StatusPill } from "@dadan/ui";
import { fetchPieces } from "../../../../lib/api/admin";
import { getAdminCookieHeader } from "../../../../lib/session/admin";

export default async function PiecesPage() {
  const cookieHeader = await getAdminCookieHeader();
  const { items, total } = await fetchPieces(1, 50, cookieHeader);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-[0.06em] uppercase">Pieces</h1>
        <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
          {total} registered {total === 1 ? "piece" : "pieces"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs tracking-[0.12em] uppercase text-[var(--color-ivory-muted)]">
            <tr>
              <th className="px-4 py-3 font-normal">Serial</th>
              <th className="px-4 py-3 font-normal">Design</th>
              <th className="px-4 py-3 font-normal">Collection</th>
              <th className="px-4 py-3 font-normal">Owner</th>
              <th className="px-4 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {items.map((piece) => (
              <tr key={piece.id}>
                <td className="px-4 py-4">
                  <SerialBadge serial={piece.serialNumber} />
                </td>
                <td className="px-4 py-4">{piece.designName}</td>
                <td className="px-4 py-4 text-[var(--color-ivory-muted)]">{piece.collection}</td>
                <td className="px-4 py-4">{piece.currentOwner ?? "—"}</td>
                <td className="px-4 py-4">
                  <StatusPill status={piece.status.replace(/_/g, " ")} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
