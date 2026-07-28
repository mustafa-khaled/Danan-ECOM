import { ClientShell, WelcomeModal } from "@/components/ui";
import { requireClientSession } from "@/features/auth/server/session";
import {
  HeroSection,
  MawaddahBanner,
  SelectedForYou,
  YourCollection,
} from "@/features/home";

export default async function HomePage() {
  const profile = await requireClientSession();

  return (
    <ClientShell displayName={profile.displayName}>
      <WelcomeModal displayName={profile.displayName} />
      <HeroSection />
      <SelectedForYou />

      <MawaddahBanner />

      <YourCollection />
    </ClientShell>
  );
}
