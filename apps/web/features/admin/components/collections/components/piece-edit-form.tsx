"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updatePiece } from "@/features/admin/api/fetch-admin-pieces";

const inputClassName =
  "w-full border-none bg-[#F8FAFC] h-12 px-4 text-[var(--color-text)]";
const labelClassName = "text-[#272D35] text-sm font-medium";

interface PieceEditFormProps {
  pieceId: string;
  initial: {
    name: string;
    nameAr: string;
    story: string;
    storyAr: string;
    material: string;
    weight: string;
    dimensions: string;
    price: string;
    notes: string;
    isActive: boolean;
  };
}

export function PieceEditForm({ pieceId, initial }: PieceEditFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(initial.name);
  const [nameAr, setNameAr] = useState(initial.nameAr);
  const [story, setStory] = useState(initial.story);
  const [storyAr, setStoryAr] = useState(initial.storyAr);
  const [material, setMaterial] = useState(initial.material);
  const [weight, setWeight] = useState(initial.weight);
  const [dimensions, setDimensions] = useState(initial.dimensions);
  const [price, setPrice] = useState(initial.price);
  const [notes, setNotes] = useState(initial.notes);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updatePiece(pieceId, {
        name,
        nameAr,
        story,
        storyAr,
        material,
        weight: Number(weight),
        dimensions,
        price: Number(price),
        notes,
      });
      router.push(`/admin/pieces/${pieceId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update piece");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className={labelClassName}>Name</span>
          <input required className={inputClassName} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className={labelClassName}>Name (Arabic)</span>
          <input required dir="rtl" className={inputClassName} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className={labelClassName}>Material</span>
          <input required className={inputClassName} value={material} onChange={(e) => setMaterial(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className={labelClassName}>Weight (g)</span>
          <input required type="number" step="0.001" className={inputClassName} value={weight} onChange={(e) => setWeight(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className={labelClassName}>Dimensions</span>
          <input required className={inputClassName} value={dimensions} onChange={(e) => setDimensions(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className={labelClassName}>Price (SAR)</span>
          <input required type="number" step="0.01" className={inputClassName} value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
      </div>
      <label className="block space-y-1">
        <span className={labelClassName}>Story</span>
        <textarea required className={`${inputClassName} h-24 py-3`} value={story} onChange={(e) => setStory(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className={labelClassName}>Story (Arabic)</span>
        <textarea required dir="rtl" className={`${inputClassName} h-24 py-3`} value={storyAr} onChange={(e) => setStoryAr(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className={labelClassName}>Notes</span>
        <textarea className={`${inputClassName} h-24 py-3`} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="h-11 px-4 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/admin/pieces/${pieceId}`)}
          className="h-11 px-4 border border-[#EAE7E4] rounded-lg text-[14px]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
