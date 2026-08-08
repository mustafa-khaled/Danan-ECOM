import LayoutHero from "@/features/profile/components/layout-hero";
import ProfileInformation from "@/features/profile/components/profile-information";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LayoutHero />

      <ProfileInformation />

      {children}
    </>
  );
}
