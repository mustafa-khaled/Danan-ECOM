export default function CollectionsLoading() {
  return (
    <div className="min-h-screen bg-void">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse space-y-8">
          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-10 w-48 rounded-[var(--radius-item)] bg-muted" />
            <div className="h-5 w-96 rounded-[var(--radius-item)] bg-muted" />
          </div>

          {/* Collections grid skeleton */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[4/3] rounded-[var(--radius-panel)] bg-muted" />
                <div className="h-6 w-3/4 rounded-[var(--radius-item)] bg-muted" />
                <div className="h-4 w-full rounded-[var(--radius-item)] bg-muted" />
                <div className="h-4 w-2/3 rounded-[var(--radius-item)] bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
