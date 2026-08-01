import Link from "next/link";
import React from "react";

interface SectionHeadProps {
  title: string;
  href?: string;
  link?: string;
  subtitle?: string;
}

export default function SectionHead({
  title,
  href,
  link,
  subtitle,
}: SectionHeadProps) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h2 className="font-english text-3xl font-bold tracking-tight text-(--color-text) sm:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm text-(--color-text-muted) sm:text-base">
            {subtitle}
          </p>
        )}
      </div>

      {href && link && (
        <Link
          href={href}
          className="inline-flex items-center justify-center gap-2 self-start bg-[#B56B5D] px-5 py-2.5 text-xs font-medium tracking-wide text-white transition-colors hover:bg-[#a05c50] sm:self-auto"
        >
          <span>{link}</span>
          <span className="rtl:rotate-180 inline-block">→</span>
        </Link>
      )}
    </div>
  );
}
