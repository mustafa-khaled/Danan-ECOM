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
      <div className="border-b border-[#E5E5E5] pb-6">
        <h1 className="font-english text-xl sm:text-2xl lg:text-3xl font-bold text-[#1D1D1D]">
          Profile Management
        </h1>
        <p className="text-xs sm:text-sm text-[#52525B] mt-1">
          Manage your personal details and account settings
        </p>
      </div>

      <section>
        <h3 className="mb-6 font-english text-xl text-[#1D1D1D] font-semibold">
          {t("personalInfo")}
        </h3>
        <ProfileForm
          initial={{
            displayName: session.displayName,
            phone: profile?.phone ?? "",
          }}
        />
      </section>

      <section className="border-t border-[#E5E5E5] pt-8">
        <h3 className="mb-4 font-english text-xl text-[#1D1D1D] font-semibold">
          {t("houseMembership")}
        </h3>
        <div className="space-y-4">
          <p className="text-sm text-[#52525B]">{t("houseKey")}: ••••••••</p>
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
