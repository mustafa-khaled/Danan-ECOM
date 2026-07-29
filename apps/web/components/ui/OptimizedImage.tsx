"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

export interface OptimizedImageProps extends Omit<ImageProps, "placeholder" | "blurDataURL"> {
  blurDataURL?: string | null;
  showSkeleton?: boolean;
}

export function OptimizedImage({
  blurDataURL,
  showSkeleton = true,
  className = "",
  onLoad,
  alt,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    onLoad?.(e);
  };

  const hasBlur = blurDataURL && blurDataURL.startsWith("data:");

  return (
    <div className="relative h-full w-full">
      {showSkeleton && isLoading && !hasBlur && (
        <div className="absolute inset-0 animate-pulse bg-[var(--color-surface)]" />
      )}
      <Image
        {...props}
        alt={alt}
        className={className}
        placeholder={hasBlur ? "blur" : "empty"}
        blurDataURL={hasBlur ? blurDataURL : undefined}
        onLoad={handleLoad}
      />
    </div>
  );
}
