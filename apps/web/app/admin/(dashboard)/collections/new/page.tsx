import { CollectionForm } from "../collection-form";

export default function NewCollectionPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl tracking-[0.06em] uppercase">
        Create Collection
      </h1>
      <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <CollectionForm mode="create" />
      </div>
    </div>
  );
}
