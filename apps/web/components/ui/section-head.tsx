import { ArrowLink } from "./ArrowLink";
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
    <div className="mb-4 md:mb-8 flex flex-col justify-between gap-2 md:gap-4 sm:flex-row sm:items-end">
      <div>
        <h2 className="font-english text-xl sm:text-3xl md:text-4xl font-bold tracking-tight text-(--color-text)">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 md:mt-2 text-xs sm:text-sm text-(--color-text-muted) md:text-base">
            {subtitle}
          </p>
        )}
      </div>

      {href && link && (
        <ArrowLink href={href} variant="primary" size="sm" className="self-start sm:self-auto">
          {link}
        </ArrowLink>
      )}
    </div>
  );
}
