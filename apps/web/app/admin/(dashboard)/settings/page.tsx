import {
  General,
  HouseAccess,
  MembershipClasses,
  RolesAndPermissions,
  SystemNotifications,
} from "@/features/admin";
import React from "react";

export default function SettingsPage() {
  return (
    <>
      <div className="bg-white h-15 px-7.5 flex items-center font-bold text-h5 text-neutral-800">
        Configure your House, access rules, and system preferences.
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
