import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="space-y-6 p-4 sm:p-6 animate-fade-up">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-fd-border bg-fd-card p-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="mt-1 h-8 w-8" />
        </div>
        <div className="rounded-lg border border-fd-border bg-fd-card p-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-1 h-8 w-12" />
        </div>
        <div className="rounded-lg border border-fd-border bg-fd-card p-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="mt-1 h-8 w-8" />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-fd-border bg-fd-card p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
