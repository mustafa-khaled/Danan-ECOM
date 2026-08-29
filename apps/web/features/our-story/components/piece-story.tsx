import Container from "@/components/ui/container";
import Image from "next/image";

export function PieceStory() {
  return (
    <section className="py-[32px] lg:py-12">
      <Container className="flex flex-col text-neutral-900">
        <h2 className="font-heading lg:text-[40px] text-h4 font-extrabold">
          Every Piece Begins With a Story
        </h2>

        <p className="lg:text-[32px] text-[14px] mt-6.5 mb-6 lg:mt-14.5 font-semibold lg:font-bold leading-[130%]">
          Before a piece is designed, a story is discovered.
          <br />
          Every collection begins with meaning, not materials.
          <br />
          Every owner becomes part of its continuation.
        </p>

        <div className="relative w-full h-181.75 overflow-hidden">
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
