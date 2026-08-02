import Image from "next/image";
import React from "react";

export default function CollectionsBanner() {
  return (
    <section className="relative w-full h-45 xs:h-[220px] sm:h-75 md:h-95 lg:h-106.5 overflow-hidden">
      {/* Background Image */}
      <Image
        src="/assets/dadan-model.png"
        alt="DADAN Collection Banner"
        fill
        priority
        sizes="100vw"
        className="object-cover object-top"
      />

      {/* Centered DADAN Logo Overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <Image
          src="/assets/dadan-logo.png"
          alt="DADAN"
          width={1969}
          height={320}
          priority
          className="w-[55%] max-w-115 min-w-45 h-auto object-contain select-none"
        />
      </div>
    </section>
  );
}

