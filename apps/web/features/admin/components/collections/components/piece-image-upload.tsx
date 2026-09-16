"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { uploadPieceImage } from "@/features/admin/api/fetch-admin-pieces";

interface PieceImageUploadProps {
  pieceId: string;
  currentImageUrl?: string | null;
}

export function PieceImageUpload({ pieceId, currentImageUrl }: PieceImageUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"main" | "gallery">("main");

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
  };

  const onUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      await uploadPieceImage(pieceId, selectedFile, role);
      setPreview(null);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {currentImageUrl && !preview && (
        <div className="relative h-48 w-48 rounded-lg overflow-hidden border border-[#E1E4E8]">
          <Image
            src={currentImageUrl}
            alt="Current piece image"
            fill
            className="object-cover"
          />
        </div>
      )}

      {preview && (
        <div className="relative inline-block">
          <div className="relative h-48 w-48 rounded-lg overflow-hidden border border-[#E1E4E8]">
            <Image src={preview} alt="Preview" fill className="object-cover" />
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center"
            aria-label="Remove selection"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-[#272D35] text-sm font-medium block">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "main" | "gallery")}
            className="border-none bg-[#F8FAFC] h-11 px-3 text-sm"
          >
            <option value="main">Main image</option>
            <option value="gallery">Gallery image</option>
          </select>
        </div>

        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={onFileChange}
            className="hidden"
            id={`piece-image-input-${pieceId}`}
          />
          <label
            htmlFor={`piece-image-input-${pieceId}`}
            className="h-11 px-4 border border-[#E1E4E8] rounded-lg text-[14px] font-medium text-[#141210] flex items-center gap-2 cursor-pointer hover:bg-[#F8FAFC] transition-colors"
          >
            <Upload className="size-4" />
            {selectedFile ? selectedFile.name : "Choose image"}
          </label>
        </div>

        {selectedFile && (
          <button
            type="button"
            disabled={uploading}
            onClick={onUpload}
            className="h-11 px-4 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
