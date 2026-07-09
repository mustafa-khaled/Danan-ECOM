export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-void">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse space-y-8">
          {/* Hero section skeleton */}
          <div className="h-64 rounded-[var(--radius-panel)] bg-muted" />

          {/* Collections grid skeleton */}
          <div className="space-y-4">
            <div className="h-8 w-48 rounded-[var(--radius-item)] bg-muted" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-square rounded-[var(--radius-panel)] bg-muted" />
                  <div className="h-6 w-3/4 rounded-[var(--radius-item)] bg-muted" />
                  <div className="h-4 w-1/2 rounded-[var(--radius-item)] bg-muted" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent pieces skeleton */}
          <div className="space-y-4">
            <div className="h-8 w-36 rounded-[var(--radius-item)] bg-muted" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-square rounded-[var(--radius-panel)] bg-muted" />
                  <div className="h-4 w-2/3 rounded-[var(--radius-item)] bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
