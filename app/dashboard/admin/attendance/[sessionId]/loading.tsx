import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function Loading() {
  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div
        className="mb-4 inline-flex items-center gap-2 sm:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
        <div className="rounded-xl border border-fd-border bg-fd-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-fd-border bg-fd-background p-4">
              <Skeleton className="h-5 w-5" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-fd-border bg-fd-background p-4">
              <Skeleton className="h-5 w-5" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-4">
            <div className="rounded-lg border border-fd-border bg-fd-success/10 p-3 text-center">
              <Skeleton className="h-3 w-12 mx-auto" />
              <Skeleton className="mt-1 h-7 w-8 mx-auto" />
            </div>
            <div className="rounded-lg border border-fd-border bg-fd-warning/10 p-3 text-center">
              <Skeleton className="h-3 w-8 mx-auto" />
              <Skeleton className="mt-1 h-7 w-6 mx-auto" />
            </div>
            <div className="rounded-lg border border-fd-border bg-fd-error/10 p-3 text-center">
              <Skeleton className="h-3 w-20 mx-auto" />
              <Skeleton className="mt-1 h-7 w-8 mx-auto" />
            </div>
            <div className="rounded-lg border border-fd-border bg-fd-muted p-3 text-center">
              <Skeleton className="h-3 w-24 mx-auto" />
              <Skeleton className="mt-1 h-7 w-8 mx-auto" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-fd-border bg-fd-card shadow-sm overflow-x-auto">
          <div className="p-6 min-w-full">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
