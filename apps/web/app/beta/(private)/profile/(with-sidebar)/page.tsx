import { getTranslations } from "next-intl/server";
import { ProfileForm } from "@/components/profile-form";
import { fetchProfile } from "@/features/profile";
import {
  getSessionCookieHeader,
  requireClientSession,
} from "@/features/auth/server/session";
import { HouseIdDisplay } from "@/components/house-id-display";
import { SectionHead } from "@/components/ui";

export default async function ProfilePage() {
  const session = await requireClientSession();
  const cookie = await getSessionCookieHeader();
  const t = await getTranslations("profile");

  const profile = await fetchProfile(cookie);

  return (
    <div className="space-y-10">
      <SectionHead
        title="Profile Management"
        className="[&_h2]:leading-[100%]! lg:mb-[32px] mb-[16px] lg:[&_h2]:text-[32px] [&_h2]:text-h4"
      />

      <section>
        <ProfileForm
          initial={{
            displayName: session.displayName,
            phone: profile?.phone ?? "",
          }}
        />
      </section>

      <section className="border-t border-ds-border pt-8">
        <h3 className="mb-4 font-heading text-lg sm:text-xl font-medium tracking-[-0.02em] text-ds-text">
          {t("houseMembership")}
        </h3>
        <div className="space-y-4">
          <p className="text-sm text-ds-text-secondary">
            {t("houseKey")}: ••••••••
          </p>
          {profile?.houseId && (
            <HouseIdDisplay
              houseId={profile.houseId}
              label={t("houseId")}
              helperText={t("houseIdHelperText")}
            />
          )}
        </div>
      </section>
    </div>
  );
}
