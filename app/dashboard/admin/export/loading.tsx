export default function AdminExportLoading() {
  return (
    <div className="relative space-y-6 p-4 sm:p-6 animate-fade-up">
      <div className="h-6 w-24 bg-fd-muted rounded animate-pulse" />

      <div className="space-y-2">
        <div className="h-7 w-48 bg-fd-muted rounded animate-pulse" />
        <div className="h-5 w-64 bg-fd-muted rounded animate-pulse" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-fd-border bg-fd-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-fd-muted rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-20 bg-fd-muted rounded animate-pulse" />
                <div className="h-6 w-12 bg-fd-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-fd-border bg-fd-card p-6 shadow-sm">
        <div className="h-6 w-40 bg-fd-muted rounded animate-pulse" />
        <div className="mt-2 h-4 w-56 bg-fd-muted rounded animate-pulse" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-fd-border p-4"
            >
              <div className="h-12 w-12 bg-fd-muted rounded-xl animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-fd-muted rounded animate-pulse" />
                <div className="h-3 w-48 bg-fd-muted rounded animate-pulse" />
              </div>
              <div className="h-5 w-5 bg-fd-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-fd-border bg-fd-card p-6 shadow-sm">
        <div className="h-6 w-40 bg-fd-muted rounded animate-pulse" />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full bg-fd-muted rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-fd-muted rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-fd-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
