import Image from "next/image";

export default function ComingSoonPage() {
  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-void text-ivory select-none">
      {/* =========================================================================
          DESKTOP VIEW (md and up)
          ========================================================================= */}
      <div className="hidden md:flex relative min-h-dvh w-full flex-col justify-between overflow-hidden">
        {/* Background Image Wrapper with Ken Burns Zoom */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/assets/coming-soon-desktop.png"
            alt="DADAN background"
            fill
            priority
            className="object-cover object-center scale-105 animate-kenburns"
            sizes="100vw"
            quality={90}
          />
          {/* Gentle dark gradient overlay for optimal readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-void/30 via-transparent to-void/40 z-10" />
        </div>

        {/* Header (Logo) */}
        <header className="relative z-20 flex justify-center pt-20 animate-slide-up">
          <div className="relative w-[220px] h-[36px]">
            <Image
              src="/assets/dadan-logo.png"
              alt="DADAN"
              fill
              priority
              className="object-contain"
            />
          </div>
        </header>

        {/* Bottom Content / Footer */}
        <footer className="absolute z-20 left-[41px] bottom-[30%] w-[1840px] max-w-[calc(100%-82px)] h-[24px] flex justify-between items-center px-0 pb-0">
          {/* Left Block: Full experience ─── is coming soon */}
          <div className="flex items-center gap-6 animate-slide-up delay-300">
            <span className="font-body text-[20px] leading-none tracking-[-0.05em] uppercase text-ivory font-normal">
              Full experience
            </span>
            <span className="w-16 h-[0.5px] bg-ivory/20 origin-left animate-draw-line-left delay-700" />
            <span className="font-body text-[20px] leading-none tracking-[-0.05em] lowercase text-ivory font-normal">
              is coming soon
            </span>
          </div>

          {/* Right Block: ─── Stay tuned. */}
          <div className="flex items-center gap-6 animate-slide-up delay-500">
            <span className="w-16 h-[0.5px] bg-ivory/20 origin-right animate-draw-line-right delay-900" />
            <span className="font-body text-[20px] leading-none tracking-[-0.05em] text-ivory font-normal">
              Stay tuned.
            </span>
          </div>
        </footer>
      </div>

      {/* =========================================================================
          MOBILE VIEW (less than md)
          ========================================================================= */}
      <div className="flex md:hidden relative min-h-dvh w-full flex-col justify-between overflow-hidden">
        {/* Background Image Wrapper with Ken Burns Zoom */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/assets/coming-soon-mobile.png"
            alt="DADAN background"
            fill
            priority
            className="object-cover object-[24%_55%] scale-100 animate-kenburns-mobile"
            sizes="100vw"
            quality={90}
          />
          {/* Gentle dark gradient overlay for optimal readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-void/40 via-transparent to-void/50 z-10" />
        </div>

        {/* Header (Logo) */}
        <header className="relative z-20 flex justify-center pt-16 animate-slide-up">
          <div className="relative w-[185px] h-[30px]">
            <Image
              src="/assets/dadan-logo.png"
              alt="DADAN"
              fill
              priority
              className="object-contain"
            />
          </div>
        </header>

        {/* Bottom Content / Footer */}
        <footer className="relative z-20 flex flex-col items-center pb-24 text-center select-none">
          {/* Arabic: قريبا */}
          <div className="animate-slide-up delay-300">
            <p className="font-arabic text-3xl font-light tracking-[0.05em] text-ivory mb-2 leading-relaxed">
              قريبا
            </p>
          </div>
          {/* English: Soon */}
          <div className="animate-slide-up delay-500">
            <p className="font-display text-4xl font-light tracking-[0.08em] text-ivory">
              Soon
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}

