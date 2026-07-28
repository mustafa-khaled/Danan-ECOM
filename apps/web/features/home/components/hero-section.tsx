import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative -mx-4 -mt-8 overflow-hidden sm:-mx-8">
      <div className="relative aspect-21/9 bg-(--color-surface)">
        <Image
          src="/assets/dadan-model.png"
          alt="DADAN"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(0.17deg, #AF6149 -39.65%, rgba(65, 149, 155, 0) 84.35%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-30 w-225.25 mx-auto flex justify-center px-4 text-center">
          <h2 className="font-english text-2xl font-semibold text-white sm:text-3xl">
            Discover stories, collections, and pieces curated <br /> exclusively
            for you within the House of <br /> DADAN.
          </h2>
        </div>
      </div>
    </section>
  );
}
