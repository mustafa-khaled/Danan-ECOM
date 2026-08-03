import Container from "@/components/ui/container";
import Image from "next/image";

export function PieceStory() {
  return (
    <section className="bg-white py-12 md:py-20">
      <Container className="flex flex-col">
        <h2 className="font-english text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-(--color-text)">
          Every Piece Begins With a Story
        </h2>

        <p className="mt-3 md:mt-4 mb-6 md:mb-10 text-xs sm:text-sm md:text-base leading-relaxed text-(--color-text-muted)">
          Before a piece is designed, a story is discovered.
          <br />
          Every collection begins with meaning, not materials.
          <br />
          Every owner becomes part of its continuation.
        </p>

        <div className="relative w-full aspect-4/7 md:aspect-21/9 overflow-hidden">
          <Image
            src="/assets/story/product-story.avif"
            alt="Every Piece Begins With a Story"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      </Container>
    </section>
  );
}
