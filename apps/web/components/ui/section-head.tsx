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
        "mb-6 md:mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end",
        className,
      )}
    >
      <div className="flex flex-col">
        <h2 className="font-heading rtl:font-arabic font-bold tracking-[-0.02em] text-2xl leading-tight md:text-3xl md:leading-tight lg:text-h2 lg:leading-22 text-ds-text">
          {title}
        </h2>
        {subtitle && (
          <p className="font-body rtl:font-arabic font-semibold tracking-normal text-lg leading-snug md:text-xl lg:text-h3 text-ds-text-secondary">
            {subtitle}
          </p>
        )}
      </div>

      {href && link && (
        <ArrowLink
          href={href}
          variant="primary"
          size="md"
          className="sm:w-auto w-full"
          fullWidth
        >
          {link}
        </ArrowLink>
      )}
    </div>
  );
}
