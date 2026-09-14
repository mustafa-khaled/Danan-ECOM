import { CollectionsOverview, PendingActions, Stats } from "@/features/admin";
import { fetchAdminOverview } from "@/features/admin/api/fetch-admin-overview";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";

export default async function DashboardPage() {
  const cookieHeader = await getAdminCookieHeader();
  const overview = await fetchAdminOverview(cookieHeader);

  return (
    <div className="px-7.5 py-6.75">
      <div className="bg-white h-254 rounded-3xl p-6 space-y-6">
        <Stats data={overview.stats} />
        <PendingActions
          pending={overview.pendingActions}
          membership={overview.membership}
        />
        <CollectionsOverview collections={overview.collections} />
      </div>
    </div>
  );
}
