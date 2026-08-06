import Container from "@/components/ui/container";
import LayoutHero from "@/features/profile/components/layout-hero";
import ProfileInformation from "@/features/profile/components/profile-information";
import ProfileAside from "@/features/profile/components/profile-aside";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LayoutHero />

      <ProfileInformation />

      <section>
        <Container className="grid my-8 md:my-12 grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 xl:gap-12 items-start">
          <ProfileAside />
          <div className="w-full min-w-0">{children}</div>
        </Container>
      </section>
    </>
  );
}
