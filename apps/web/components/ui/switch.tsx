"use client";

import * as React from "react";
import { Switch as ArkSwitch } from "@ark-ui/react/switch";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export type SwitchVariant = "default" | "brand" | "success";
export type SwitchSize = "sm" | "md" | "lg";

export interface SwitchProps {
  id?: string;
  name?: string;
  value?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
  onCheckedChange?: (details: { checked: boolean }) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  offLabel?: React.ReactNode;
  onLabel?: React.ReactNode;
  variant?: SwitchVariant;
  size?: SwitchSize;
  className?: string;
  controlClassName?: string;
  thumbClassName?: string;
}

const variantStyles: Record<
  SwitchVariant,
  {
    control: string;
    thumb: string;
  }
> = {
  default: {
    control:
      "bg-gray-300 dark:bg-gray-600 data-[state=checked]:bg-blue-600 data-focus-visible:ring-gray-300/50 data-[state=checked]:data-focus-visible:ring-blue-500/50",
    thumb: "bg-white",
  },
  brand: {
    control:
      "bg-brown-200 dark:bg-brown-700 data-[state=checked]:bg-warm-500 data-focus-visible:ring-warm-500/30",
    thumb: "bg-white",
  },
  success: {
    control:
      "bg-[#EBFAF0] border border-[#36C76C]/20 data-[state=checked]:bg-[#EBFAF0] data-focus-visible:ring-[#36C76C]/40",
    thumb:
      "bg-[#36C76C] shadow-[0_1px_3px_rgba(54,199,108,0.3)] data-[state=unchecked]:bg-gray-300",
  },
};

const sizeStyles: Record<
  SwitchSize,
  {
    control: string;
    thumb: string;
    translate: string;
  }
> = {
  sm: {
    control: "w-8 h-4.5 p-0.5",
    thumb: "w-3.5 h-3.5",
    translate: "data-[state=checked]:translate-x-3.5",
  },
  md: {
    control: "w-11 h-6 p-0.5",
    thumb: "w-5 h-5",
    translate: "data-[state=checked]:translate-x-5",
  },
  lg: {
    control: "w-14 h-7.5 p-0.5",
    thumb: "w-6.5 h-6.5",
    translate: "data-[state=checked]:translate-x-6.5",
  },
};

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      id,
      name,
      value,
      checked,
      defaultChecked,
      disabled = false,
      readOnly = false,
      required = false,
      invalid = false,
      onCheckedChange,
      label,
      description,
      offLabel,
      onLabel,
      variant = "default",
      size = "md",
      className,
      controlClassName,
      thumbClassName,
    },
    ref
  ) => {
    const currentVariant = variantStyles[variant] || variantStyles.default;
    const currentSize = sizeStyles[size] || sizeStyles.md;

    return (
      <ArkSwitch.Root
        id={id}
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        invalid={invalid}
        onCheckedChange={onCheckedChange}
        className={cn(
          "inline-flex items-center gap-3 select-none cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
      >
        <ArkSwitch.Context>
          {(api) => (
            <>
              {offLabel && (
                <span
                  data-checked={api.checked ? "" : undefined}
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    api.checked
                      ? "text-gray-400 dark:text-gray-500"
                      : "text-gray-900 dark:text-gray-100"
                  )}
                >
                  {offLabel}
                </span>
              )}

              <ArkSwitch.Control
                className={cn(
                  "relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out data-focus-visible:ring-2",
                  currentSize.control,
                  currentVariant.control,
                  controlClassName
                )}
              >
                <ArkSwitch.Thumb
                  className={cn(
                    "rounded-full shadow-sm transition-transform duration-200 ease-in-out",
                    currentSize.thumb,
                    currentSize.translate,
                    currentVariant.thumb,
                    thumbClassName
                  )}
                />
              </ArkSwitch.Control>

              {onLabel && (
                <span
                  data-checked={api.checked ? "" : undefined}
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    api.checked
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-gray-400 dark:text-gray-500"
                  )}
                >
                  {onLabel}
                </span>
              )}

              {(label || description) && !offLabel && !onLabel && (
                <div className="flex flex-col text-left">
                  {label && (
                    <ArkSwitch.Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {label}
                    </ArkSwitch.Label>
                  )}
                  {description && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {description}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </ArkSwitch.Context>
        <ArkSwitch.HiddenInput ref={ref} />
      </ArkSwitch.Root>
    );
  }
);

Switch.displayName = "Switch";
