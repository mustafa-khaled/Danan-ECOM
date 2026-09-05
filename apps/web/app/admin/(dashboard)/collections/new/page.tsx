import { CollectionForm } from "@/features/admin";

export default function NewCollectionPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl tracking-[0.06em] uppercase">
        Create Collection
      </h1>
      <div className="rounded-(--radius-panel) border border-(--color-border) bg-(--color-surface) p-6">
        <CollectionForm mode="create" />
      </div>
    </div>
  );
}
