import { CollectionsOverview, PendingActions, Stats } from "@/features/admin";

export default async function DashboardPage() {
  return (
    <div className="px-7.5 py-6.75">
      <div className="bg-white h-254 rounded-3xl p-6 space-y-6">
        <Stats />
        <PendingActions />
        <CollectionsOverview />
      </div>
    </div>
  );
}
