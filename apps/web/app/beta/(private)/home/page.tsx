import { WelcomeModal } from "@/components/ui";
import {
  HeroSection,
  ExploreCollections,
  SelectedForYou,
  YourCollection,
  AboutDadan,
  fetchSelectedForYou,
} from "@/features/home";
import { fetchCollections } from "@/features/collections";
import { fetchWardrobe } from "@/features/wardrobe";
import { getSessionCookieHeader } from "@/features/auth/server/session";

export default async function HomePage() {
  const cookie = await getSessionCookieHeader();

  const [selectedPieces, collections, wardrobe] = await Promise.all([
    fetchSelectedForYou(cookie).catch(() => []),
    fetchCollections(cookie).catch(() => []),
    fetchWardrobe(cookie, { limit: 3 }).catch(() => []),
  ]);

  return (
    <>
      <WelcomeModal />
      <HeroSection />
      <SelectedForYou data={selectedPieces} />
      <ExploreCollections data={collections} />
      <YourCollection data={wardrobe} />
      <AboutDadan />
    </>
  );
}
