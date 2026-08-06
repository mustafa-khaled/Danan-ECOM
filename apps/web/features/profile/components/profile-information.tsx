import Container from "@/components/ui/container";
import Link from "next/link";
import {
  getSessionCookieHeader,
  requireClientSession,
} from "@/features/auth/server/session";
import { fetchWardrobe } from "@/features/wardrobe";
import { fetchTransfers } from "@/features/transfers";

export default async function ProfileInformation() {
  const session = await requireClientSession().catch(() => null);
  const cookie = await getSessionCookieHeader().catch(() => "");

  const [wardrobe, transfers] = await Promise.all([
    fetchWardrobe(cookie).catch(() => []),
    fetchTransfers(cookie).catch(() => []),
  ]);

  // const profile = await fetchProfile(cookie);

  const displayName = session?.displayName || "Ahmed Gad";
  const memberSinceYear = "2026";
  const ownedCount = wardrobe.length;
  const certificatesCount = wardrobe.length;
  const pendingTransfersCount = transfers.filter(
    (t) => t.status === "PENDING",
  ).length;

  return (
    <section className="my-6 md:my-8">
      <Container>
        <div className="w-full bg-[#FBF8F3] max-h-65.75 md:max-h-none py-6 sm:py-8 md:py-10 px-4 sm:px-8 flex flex-col items-center justify-center text-center overflow-hidden">
          {/* User Name & Member Since */}
          <div className="flex flex-col items-center">
            <h2 className="font-english text-xl sm:text-2xl md:text-3xl text-[#1D1D1D] font-bold tracking-tight">
              {displayName}
            </h2>
            <p className="text-xs sm:text-sm text-[#52525B] mt-1.5 font-normal">
              Member Since {memberSinceYear}
            </p>
          </div>

          {/* Mobile View: Vertical list (max-height 263px) */}
          <div className="flex md:hidden flex-col items-center justify-center gap-2.5 mt-5 text-xs sm:text-sm font-medium text-[#1E293B]">
            <Link
              href="/beta/profile/wardrobe"
              className="hover:text-black transition-colors"
            >
              {ownedCount} Owned {ownedCount === 1 ? "Piece" : "Pieces"}
            </Link>
            <Link
              href="/beta/profile/wardrobe/certificates"
              className="hover:text-black transition-colors"
            >
              {certificatesCount}{" "}
              {certificatesCount === 1 ? "Certificate" : "Certificates"}
            </Link>
            <Link
              href="/beta/transfers"
              className="hover:text-black transition-colors"
            >
              {pendingTransfersCount} Pending{" "}
              {pendingTransfersCount === 1 ? "Transfer" : "Transfers"}
            </Link>
          </div>

          {/* Desktop View: Horizontal 3-column Row */}
          <div className="hidden md:grid md:grid-cols-3 md:items-center md:text-center w-full max-w-4xl mx-auto mt-8 md:mt-10 text-sm md:text-base font-medium text-[#1E293B]">
            <Link
              href="/beta/profile/wardrobe"
              className="hover:text-black transition-colors text-center"
            >
              {ownedCount} Owned {ownedCount === 1 ? "Piece" : "Pieces"}
            </Link>
            <Link
              href="/beta/profile/wardrobe/certificates"
              className="hover:text-black transition-colors text-center"
            >
              {certificatesCount}{" "}
              {certificatesCount === 1 ? "Certificate" : "Certificates"}
            </Link>
            <Link
              href="/beta/transfers"
              className="hover:text-black transition-colors text-center"
            >
              {pendingTransfersCount} Pending{" "}
              {pendingTransfersCount === 1 ? "Transfer" : "Transfers"}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
