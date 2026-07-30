import type { ReactNode } from "react";
import Image from "next/image";

interface SplitHeroLayoutProps {
  imageSrc: string;
  imageAlt: string;
  children: ReactNode;
}

export function SplitHeroLayout({ imageSrc, imageAlt, children }: SplitHeroLayoutProps) {
  return (
    <div className="flex min-h-dvh w-full bg-white">
      <div className="relative hidden w-[55%] shrink-0 overflow-hidden md:block">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          quality={85}
          sizes="55vw"
          className="object-cover object-top"
        />
      </div>
      <div className="flex min-h-dvh flex-1 flex-col bg-white px-6 py-8 text-[var(--color-text)] md:px-14">
        {children}
      </div>
    </div>
  );
}
