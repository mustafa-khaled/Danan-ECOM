import Image from "next/image";

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
            src="/assets/dadan-model.png"
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
            src="/assets/dadan-model.png"
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

        {/* Header (Logo) */}
        <header className="relative z-20 flex justify-center pt-16 animate-slide-up">
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
