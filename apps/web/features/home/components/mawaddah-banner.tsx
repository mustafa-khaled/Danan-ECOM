import Image from "next/image";
import Link from "next/link";

export default function MawaddahBanner() {
  return (
    <section className="relative -mx-4 overflow-hidden sm:-mx-8">
      <div className="relative aspect-16/7 bg-(--color-surface)">
        <Image
          src="/assets/mawaddah.png"
          alt="Mawaddah Collection"
          fill
          sizes="100vw"
          className="object-cover"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(75.28deg, #AF6149 1.63%, rgba(65, 149, 155, 0) 75.41%)",
          }}
        />
        {/* Text content */}
        <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12 md:p-16 lg:p-20">
          <h2 className="font-english text-white font-bold text-4xl">
            Mawaddah
          </h2>
          <p className="mt-4 max-w-150 text-white font-semibold text-2xl">
            Inspired by the architecture of traditional Saudi homes and the
            strength of family bonds
          </p>
          <Link
            href="/beta/collections"
            className="mt-6 inline-flex h-14.25 p-3 bg-[#4CBEAE] w-89.5 items-center gap-8.75 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Explore Your Experience
            <span className="rtl:rotate-180">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
