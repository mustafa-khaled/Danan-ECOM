"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PieceCard } from "@/components/ui/PieceCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface CollectionCarouselProps {
  items: {
    id: string;
    name: string;
    imageUrl: string;
    ownedSince: string;
    href: string;
    subtitle?: string;
  }[];
  ownedSinceLabel: string;
}

export function CollectionCarousel({
  items,
  ownedSinceLabel,
}: CollectionCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState<"ltr" | "rtl" | null>(null);

  // Detect direction once on mount — carousel won't render until this is set
  useEffect(() => {
    setDir(document.documentElement.dir === "rtl" ? "rtl" : "ltr");
  }, []);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Don't render until direction is known so Embla initializes correctly
  if (!dir) return null;

  return (
    <div className="md:hidden">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          dragFree: true,
          direction: dir,
        }}
      >
        <CarouselContent className="-ms-3">
          {items.map((piece) => (
            <CarouselItem key={piece.id} className="basis-[70%] ps-3">
              <Link href={piece.href} className="block">
                <PieceCard
                  piece={{
                    id: piece.id,
                    name: piece.name,
                    ownedSince: piece.ownedSince || undefined,
                    imageUrl: piece.imageUrl,
                  }}
                />
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {items.map((_, index) => (
            <button
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                current === index
                  ? "w-5 bg-warm-500"
                  : "w-1.5 bg-ds-border",
              )}
              onClick={() => api?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

