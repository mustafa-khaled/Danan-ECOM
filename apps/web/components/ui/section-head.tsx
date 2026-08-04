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
    <div className="mb-4 md:mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h2 className="font-english rtl:font-arabic text-[24px] font-bold leading-[100%] tracking-[-0.02em] text-(--color-text) sm:text-3xl md:text-4xl sm:leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="font-manrope rtl:font-arabic mt-2 text-[17px] font-semibold leading-[100%] tracking-normal text-(--color-text-muted)">
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
