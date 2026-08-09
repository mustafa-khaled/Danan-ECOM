"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface HouseIdDisplayProps {
  houseId: string;
  label: string;
  helperText: string;
}

export function HouseIdDisplay({ houseId, label, helperText }: HouseIdDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(houseId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard access denied - silently fail */
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-[#52525B]">{label}</p>
      <div className="flex items-center gap-3">
        <code className="px-4 py-2 bg-gray-100 rounded-md font-mono text-lg tracking-widest text-[#1D1D1D] select-all">
          {houseId}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#4CBEAE] border border-[#4CBEAE] rounded-md hover:bg-[#4CBEAE]/10 transition-colors"
          aria-label="Copy House ID"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-[#71717A]">{helperText}</p>
    </div>
  );
}
