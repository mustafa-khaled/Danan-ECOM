import { cn } from "@/lib/utils";
import { ArrowLink } from "./ArrowLink";
import React from "react";

interface SectionHeadProps {
  title: string;
  href?: string;
  link?: string;
  subtitle?: string;
  className?: string;
}

export default function SectionHead({
  title,
  href,
  link,
  subtitle,
  className,
}: SectionHeadProps) {
  return (
    <div
      className={cn(
        "mb-4 md:mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end",
        className,
      )}
    >
      <div>
        <h2 className="font-heading rtl:font-arabic text-2xl sm:text-3xl md:text-4xl font-medium tracking-[-0.02em] leading-tight text-ds-text">
          {title}
        </h2>
        {subtitle && (
          <p className="font-body rtl:font-arabic mt-2 text-sm sm:text-base font-normal tracking-[-0.02em] leading-relaxed text-ds-text-secondary">
            {subtitle}
          </p>
        )}
      </div>

      {href && link && (
        <ArrowLink
          href={href}
          variant="primary"
          size="sm"
          className="sm:w-auto w-full"
        >
          {link}
        </ArrowLink>
      )}
    </div>
  );
}
