import { fetchAdminDesigns } from "@/features/admin/api/fetch-admin-collections";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { RegisterPieceForm } from "../register-piece-form";

export default async function NewPiecePage() {
  const cookieHeader = await getAdminCookieHeader();
  const { items: designs } = await fetchAdminDesigns(1, 200, undefined, cookieHeader);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-[0.06em] uppercase">Register Piece</h1>
        <p className="mt-2 text-sm text-[var(--color-ivory-muted)]">
          Register a new physical jewelry piece. A unique serial number will be generated automatically.
        </p>
      </div>

      <RegisterPieceForm designs={designs} />
    </div>
  );
}
