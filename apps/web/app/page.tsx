export default function ComingSoonPage() {
  return (
    <div
      lang="ar"
      dir="rtl"
      className="client-shell min-h-dvh"
    >
      <div className="access-gate-bg relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-12">
        <div
          aria-hidden="true"
          className="access-gate-grid pointer-events-none absolute inset-0 opacity-70"
        />

        <div className="relative z-10 text-center">
          <p className="font-display text-5xl tracking-[0.14em] uppercase text-[var(--color-ivory)] sm:text-6xl">
            DADAN
          </p>
          <p className="mt-2 text-xs tracking-[0.28em] uppercase text-[var(--color-gold-light)]">
            Dijital
          </p>

          <div className="mt-12">
            <p className="font-display text-2xl tracking-[0.1em] uppercase text-[var(--color-ivory)]">
              Coming Soon
            </p>
            <p className="font-arabic mt-4 text-base text-[var(--color-ivory-muted)]">
              قريباً
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
