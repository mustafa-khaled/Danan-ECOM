import { Suspense } from "react";
import { LoadingState } from "@/shared/components/feedback/loading-state";

export default function BetaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="client" className="min-h-dvh bg-transparent">
      <Suspense fallback={<LoadingState fullScreen />}>
        {children}
      </Suspense>
    </div>
  );
}
