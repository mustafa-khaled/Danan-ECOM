import Container from "@/components/ui/container";
import ProfileAside from "@/features/profile/components/profile-aside";

export default function ProfileSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      <Container className="flex flex-col gap-6 xl:flex-row lg:items-start lg:gap-12 lg:pt-12 lg:pb-[64px] py-6">
        <ProfileAside />
        <div className="w-full">{children}</div>
      </Container>
    </section>
  );
}
