"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
      <p className="text-sm text-ds-text-secondary font-body">{label}</p>
      <div className="flex items-center gap-3">
        <code className="px-4 py-2 bg-ds-surface rounded-(--radius-sm) font-mono text-lg tracking-widest text-ds-text select-all border border-ds-border-light">
          {houseId}
        </code>
        <Button
          type="button"
          onClick={handleCopy}
          variant="outline"
          size="sm"
          iconLeft={copied ? <Check className="size-4 text-ds-success" /> : <Copy className="size-4" />}
          aria-label="Copy House ID"
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="text-xs text-ds-text-muted font-body">{helperText}</p>
    </div>
  );
}
