import Image from "next/image";
import React from "react";

export default function CollectionsBanner() {
  return (
    <section className="relative w-full h-122.75 lg:h-106.5 overflow-hidden">
      {/* Background Image */}
      <Image
        src="/assets/dadan-model.avif"
        alt="DADAN Collection Banner"
        fill
        priority
        sizes="100vw"
        className="object-cover lg:object-[0_22%]"
      />

      {/* Centered DADAN Logo Overlay */}
      <div className="absolute inset-0 flex items-end justify-center pb-49.25 px-4 lg:items-center lg:pb-0 lg:p-4 pointer-events-none">
        <Image
          src="/assets/dadan-logo.png"
          alt="DADAN"
          width={1969}
          height={320}
          priority
          className="lg:w-178.5 w-71.5 h-auto object-contain select-none"
        />
      </div>
    </section>
  );
}