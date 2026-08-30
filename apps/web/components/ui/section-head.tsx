import { cn } from "@/lib/utils";
import { ArrowLink } from "./ArrowLink";
import React from "react";

interface SectionHeadProps {
  title: string;
  href?: string;
  link?: string;
  subtitle?: string;
  className?: string;
  buttonClassName?: string;
}

export default function SectionHead({
  title,
  href,
  link,
  subtitle,
  className,
  buttonClassName,
}: SectionHeadProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-5 sm:flex-row sm:items-end",
        className,
      )}
    >
      <div className="flex flex-col">
        <h2 className="font-heading rtl:font-arabic font-bold lg:text-h1 text-neutral-900 leading-[100%] text-h4">
          {title}
        </h2>
        {subtitle && (
          <p className="font-body rtl:font-arabic text-neutral-700 lg:mt-[16px] mt-2 lg:text-h3 text-body-lg font-semibold">
            {subtitle}
          </p>
        )}
      </div>

      {href && link && (
        <ArrowLink
          href={href}
          variant="primary"
          size="md"
          className={cn("sm:w-auto w-full lg:text-h5 text-[14px]", buttonClassName)}
          fullWidth
        >
          {link}
        </ArrowLink>
      )}
    </div>
  );
}
