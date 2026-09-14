"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { registerPiece } from "@/features/admin/api/fetch-admin-pieces";

interface RegisterPieceFormProps {
  collectionId: string;
}

const inputClassName =
  "w-full border-none bg-[#F8FAFC] h-12 px-4 text-[var(--color-text)]";
const labelClassName = "text-[#272D35] text-sm font-medium";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function RegisterPieceForm({ collectionId }: RegisterPieceFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [slug, setSlug] = useState("");
  const [story, setStory] = useState("");
  const [storyAr, setStoryAr] = useState("");
  const [material, setMaterial] = useState("");
  const [weight, setWeight] = useState("1");
  const [dimensions, setDimensions] = useState("");
  const [price, setPrice] = useState("0");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await registerPiece({
        collectionId,
        name,
        nameAr,
        slug: slug || slugify(name),
        story,
        storyAr,
        material,
        weight: Number(weight),
        dimensions,
        price: Number(price),
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register piece");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 px-4 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white"
      >
        Register piece
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-[#E1E4E8] p-6">
      <h3 className="font-heading text-h5 font-bold">Register piece</h3>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className={labelClassName}>Name</span>
          <input
            required
            className={inputClassName}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slug) setSlug(slugify(e.target.value));
            }}
          />
        </label>
        <label className="space-y-1">
          <span className={labelClassName}>Name (Arabic)</span>
          <input required dir="rtl" className={inputClassName} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className={labelClassName}>Slug</span>
          <input required className={inputClassName} value={slug} onChange={(e) => setSlug(e.target.value)} />
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
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="h-11 px-4 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white"
        >
          {saving ? "Saving…" : "Create piece"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-11 px-4 border border-[#EAE7E4] rounded-lg text-[14px]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
