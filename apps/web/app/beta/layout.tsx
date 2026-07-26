import { Suspense } from "react";

export default function BetaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="client" className="min-h-dvh bg-transparent">
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center">
            Loading...
          </div>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}
