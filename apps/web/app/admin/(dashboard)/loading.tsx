export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-void p-6">
      <div className="animate-pulse space-y-8">
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3 rounded-[var(--radius-panel)] border border-border bg-surface p-6">
              <div className="h-4 w-24 rounded-[var(--radius-item)] bg-muted" />
              <div className="h-8 w-16 rounded-[var(--radius-item)] bg-muted" />
            </div>
          ))}
        </div>

        {/* Recent activity skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-40 rounded-[var(--radius-item)] bg-muted" />
          <div className="divide-y divide-[var(--color-border)] rounded-[var(--radius-panel)] border border-border bg-surface">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded-[var(--radius-item)] bg-muted" />
                  <div className="h-3 w-32 rounded-[var(--radius-item)] bg-muted" />
                </div>
                <div className="h-6 w-20 rounded-[var(--radius-item)] bg-muted" />
              </div>
            ))}
          </div>
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-4 rounded-[var(--radius-panel)] border border-border bg-surface p-6">
              <div className="h-5 w-32 rounded-[var(--radius-item)] bg-muted" />
              <div className="h-48 rounded-[var(--radius-panel)] bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
