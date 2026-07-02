export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="animate-pulse space-y-8">
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-6 space-y-3">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-8 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>

        {/* Recent activity skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-40 bg-muted rounded" />
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
                <div className="h-6 w-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="h-5 w-32 bg-muted rounded" />
              <div className="h-48 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
