import { CollectionForm } from "@/features/admin";
import { X } from "lucide-react";

export default function NewCollectionPage() {
  return (
    <div className="px-7.5 py-6.75">
      <div className="bg-white rounded-3xl p-6 space-y-6">
        <div className="flex items-start justify-between pb-[32px] border-b border-[#E1E4E8]">
          <div className="font-bold leading-[100%]">
            <h2 className="font-heading text-[32px]">Create Collection</h2>
            <p className="mt-[16px] text-h5">
              Add a new collection to the House.
            </p>
          </div>
          <X className="size-[40px]" strokeWidth={1} />
        </div>

        <CollectionForm mode="create" />
      </div>
    </div>
  );
}
