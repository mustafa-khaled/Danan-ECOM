import { WelcomeModal } from "@/components/ui";
import {
  HeroSection,
  ExploreCollections,
  SelectedForYou,
  YourCollection,
  AboutDadan,
} from "@/features/home";

export default async function HomePage() {
  return (
    <>
      <WelcomeModal />
      <HeroSection />
      <SelectedForYou />
      <ExploreCollections />
      <YourCollection />
      <AboutDadan />
    </>
  );
}
