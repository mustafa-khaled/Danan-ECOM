import {
  CollectionsStats,
  CollectionsTableFilter,
  CollectionTable,
} from "@/features/admin";

export default async function CollectionsPage() {
  return (
    <>
      <div className="bg-white h-15 px-7.5 flex items-center font-bold text-h5 text-neutral-800">
        Curate the stories, pieces, and experiences that belong to the House
      </div>

      <div className="px-7.5 py-6.75">
        <div className="bg-white h-190 rounded-3xl p-6 space-y-6">
          <CollectionsStats />

          <div className="space-y-[16px]">
            <CollectionsTableFilter />
            <CollectionTable />
          </div>
        </div>
      </div>
    </>
  );
}
