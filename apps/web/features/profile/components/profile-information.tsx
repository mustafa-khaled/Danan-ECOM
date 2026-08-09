import Container from "@/components/ui/container";
import Link from "next/link";
import { getSessionCookieHeader } from "@/features/auth/server/session";
import { fetchProfileSummary } from "@/features/profile";

export default async function ProfileInformation() {
  const cookie = await getSessionCookieHeader().catch(() => "");
  const summary = await fetchProfileSummary(cookie).catch(() => null);

  if (!summary) {
    return null;
  }

  const displayName = summary.displayName;
  const memberSinceYear = new Date(summary.memberSince).getFullYear().toString();
  const ownedCount = summary.ownedPiecesCount;
  const certificatesCount = summary.certificatesCount;
  const pendingTransfersCount = summary.pendingTransfersCount;

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
              href="/beta/profile/certificates"
              className="hover:text-black transition-colors"
            >
              {certificatesCount}{" "}
              {certificatesCount === 1 ? "Certificate" : "Certificates"}
            </Link>
            <Link
              href="/beta/profile/transfers"
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
              href="/beta/profile/certificates"
              className="hover:text-black transition-colors text-center"
            >
              {certificatesCount}{" "}
              {certificatesCount === 1 ? "Certificate" : "Certificates"}
            </Link>
            <Link
              href="/beta/profile/transfers"
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
