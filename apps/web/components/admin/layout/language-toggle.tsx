import { ChevronDown } from "lucide-react";
import Image from "next/image";
import React from "react";

export default function LanguageToggle() {
  return (
    <button
      type="button"
      className="flex items-center gap-1.25 cursor-pointer w-19.25"
    >
      <ChevronDown className="size-5" />
      <Image src="/admin/language-icon.svg" alt="" width={24} height={17} />
    </button>
  );
}
