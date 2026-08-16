import Image from "next/image";
import Link from "next/link";

function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function ComingSoonPage() {
  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-ds-dark-bg text-ds-dark-text select-none">
      {/* =========================================================================
          DESKTOP VIEW (md and up)
          ========================================================================= */}
      <div className="hidden md:flex relative min-h-dvh w-full flex-col justify-between overflow-hidden">
        {/* Background Image with Ken Burns Zoom */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/assets/dadan-model.avif"
            alt="DADAN background"
            fill
            priority
            quality={75}
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Gentle dark gradient overlay for optimal readability */}
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/60 z-10" />
        </div>

        {/* Header (Logo) */}
        <header className="relative z-20 flex justify-center pt-20 animate-slide-up">
          <div className="relative w-55 h-9">
            <Image
              src="/assets/dadan-logo.png"
              alt="DADAN"
              fill
              priority
              quality={75}
              sizes="220px"
              className="object-contain"
            />
          </div>
        </header>

        {/* Bottom Content / Footer */}
        <footer className="absolute z-20 px-10 w-full flex justify-between items-center bottom-[27%] text-center select-none">
          <div className="animate-slide-up [animation-delay:500ms]">
            <p className="font-heading font-semibold text-[64px] leading-none tracking-tighter text-white">
              Soon
            </p>
          </div>

          <Link
            href="https://www.instagram.com/dadanjewelr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:opacity-80 transition-opacity"
          >
            <InstagramIcon className="size-12" />
          </Link>

          <div className="animate-slide-up [animation-delay:300ms]">
            <p className="font-arabic font-normal text-[64px] leading-none tracking-tighter text-white mb-2">
              قريبا
            </p>
          </div>
        </footer>
      </div>

      {/* =========================================================================
          MOBILE VIEW (below md)
          ========================================================================= */}
      <div className="flex md:hidden relative min-h-dvh w-full flex-col justify-between overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/assets/dadan-model.avif"
            alt="DADAN background"
            fill
            priority
            quality={75}
            sizes="100vw"
            className="object-cover object-[40%]"
          />
          {/* Gentle dark gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/60 z-10" />
        </div>

        {/* Header (Logo) */}
        <header className="relative z-20 flex px-6 justify-center pt-16 flex-col items-center gap-4 animate-slide-up">
          <div className="relative w-46 h-7.5">
            <Image
              src="/assets/dadan-logo.png"
              alt="DADAN"
              fill
              priority
              quality={75}
              sizes="185px"
              className="object-contain"
            />
          </div>
        </header>

        {/* Bottom Content / Footer */}
        <footer className="absolute z-20 px-12 w-full flex justify-between items-center bottom-[18%] text-center select-none">
          <div className="animate-slide-up [animation-delay:500ms]">
            <p className="font-heading text-[32px] leading-none tracking-tighter text-white">
              Soon
            </p>
          </div>
          <div>
            <Link
              href="https://www.instagram.com/dadanjewelr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:opacity-80 transition-opacity"
            >
              <InstagramIcon className="size-6" />
            </Link>
          </div>

          <div className="animate-slide-up [animation-delay:300ms]">
            <p className="font-arabic text-[32px] leading-none tracking-tighter text-white mb-2">
              قريبا
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
