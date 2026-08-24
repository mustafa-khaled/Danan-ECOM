import { getTranslations } from "next-intl/server";
import { ProfileForm } from "@/components/profile-form";
import { fetchProfile } from "@/features/profile";
import {
  getSessionCookieHeader,
  requireClientSession,
} from "@/features/auth/server/session";
import { HouseIdDisplay } from "@/components/house-id-display";

export default async function ProfilePage() {
  const session = await requireClientSession();
  const cookie = await getSessionCookieHeader();
  const t = await getTranslations("profile");

  const profile = await fetchProfile(cookie);

  return (
    <div className="space-y-10">
      <div className="border-b border-ds-border pb-6">
        <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-medium tracking-[-0.02em] text-ds-text">
          Profile Management
        </h1>
        <p className="text-xs sm:text-sm font-normal text-ds-text-secondary mt-1">
          Manage your personal details and account settings
        </p>
      </div>

      <section>
        <h3 className="mb-6 font-heading text-lg sm:text-xl font-medium tracking-[-0.02em] text-ds-text">
          {t("personalInfo")}
        </h3>
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
          <p className="text-sm text-ds-text-secondary">{t("houseKey")}: ••••••••</p>
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
