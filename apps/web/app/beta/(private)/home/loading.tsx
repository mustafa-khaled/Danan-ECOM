export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-64 bg-(--color-surface)" />
          <div className="space-y-4">
            <div className="h-8 w-48 bg-(--color-surface)" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-square bg-(--color-surface)" />
                  <div className="h-6 w-3/4 bg-(--color-surface)" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
