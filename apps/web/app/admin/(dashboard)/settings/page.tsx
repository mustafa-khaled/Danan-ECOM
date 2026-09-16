import {
  General,
  HouseAccess,
  MembershipClasses,
  RolesAndPermissions,
  SystemNotifications,
} from "@/features/admin";
import React from "react";
import { getTranslations } from "next-intl/server";

export default async function SettingsPage() {
  const t = await getTranslations("admin");
  return (
    <>
      <div className="bg-white h-15 px-7.5 flex items-center font-bold text-h5 text-neutral-800">
        {t("settings.banner")}
      </div>

      <div className="px-7.5 py-6.75">
        <div className="bg-white rounded-3xl p-6 space-y-6">
          <div className="space-y-4">
            <General />
            <HouseAccess />
            <MembershipClasses />
            <RolesAndPermissions />
            <SystemNotifications />
          </div>
        </div>
      </div>
    </>
  );
}
