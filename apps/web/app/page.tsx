import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
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
    <main className="relative min-h-dvh w-full overflow-hidden bg-void text-ivory select-none">
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
          <div className="absolute inset-0 bg-linear-to-b from-void/30 via-transparent to-void/40 z-10" />
        </div>

        {/* Header (Logo) */}
        <header className="relative z-20 flex px-30 gap-7.5 justify-center pt-20 flex-col animate-slide-up">
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

          <Link
            href="https://www.instagram.com/dadanjewelr/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-66 h-10 rounded-lg p-2 flex items-center justify-between bg-[#FFFFFF29] backdrop-blur-md text-white hover:bg-[#FFFFFF38] transition-colors duration-200"
          >
            <div className="flex items-center gap-2">
              <InstagramIcon className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white tracking-wide">
                Instagram
              </span>
            </div>
            <ArrowUpRight className="w-5 h-5 text-white" />
          </Link>
        </header>

        {/* Bottom Content / Footer */}
        <footer className="absolute z-20 px-10.25 w-full flex justify-between items-center bottom-[27%] text-center select-none">
          <div className="animate-slide-up [animation-delay:500ms]">
            <p className="font-english font-semibold text-[30px] leading-[100%] tracking-tighter text-ivory">
              Soon
            </p>
          </div>

          <div className="animate-slide-up [animation-delay:300ms]">
            <p className="font-arabic font-normal text-[24px] leading-[100%] tracking-tighter text-ivory mb-2">
              قريبا
            </p>
          </div>
        </footer>
      </div>

      {/* =========================================================================
          MOBILE VIEW (below md)
          ========================================================================= */}
      <div className="flex md:hidden relative min-h-dvh w-full flex-col justify-between overflow-hidden">
        {/* Background Image with Ken Burns Zoom */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/assets/dadan-model.avif"
            alt="DADAN background"
            fill
            priority
            quality={75}
            sizes="100vw"
            className="object-cover object-[22%]"
          />
          {/* Gentle dark gradient overlay for optimal readability */}
          <div className="absolute inset-0 bg-linear-to-b from-void/40 via-transparent to-void/50 z-10" />
        </div>

        {/* Header (Logo & Instagram) */}
        <header className="relative z-20 flex px-6 justify-center pt-16 flex-col items-center gap-4 animate-slide-up">
          <div className="relative w-46.25 h-7.5">
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

          <Link
            href="https://www.instagram.com/dadanjewelr/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-66 h-10 rounded-lg p-2 flex items-center justify-between bg-[#FFFFFF29] backdrop-blur-md text-white hover:bg-[#FFFFFF38] transition-colors duration-200"
          >
            <div className="flex items-center gap-2">
              <InstagramIcon className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white tracking-wide">
                Instagram
              </span>
            </div>
            <ArrowUpRight className="w-5 h-5 text-white" />
          </Link>
        </header>

        {/* Bottom Content / Footer */}
        <footer className="absolute z-20 px-12.75 w-full flex justify-between items-center bottom-[18%] text-center select-none">
          <div className="animate-slide-up [animation-delay:500ms]">
            <p className="font-english font-semibold text-[30px] leading-[100%] tracking-tighter text-ivory">
              Soon
            </p>
          </div>

          <div className="animate-slide-up [animation-delay:300ms]">
            <p className="font-arabic font-normal text-[24px] leading-[100%] tracking-tighter text-ivory mb-2">
              قريبا
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
