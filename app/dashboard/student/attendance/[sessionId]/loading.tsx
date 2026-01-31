import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, MapPin } from "lucide-react";

export default function Loading() {
  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div
        className="mb-4 inline-flex items-center gap-2 sm:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="mx-auto max-w-5xl space-y-6 animate-fade-up">
        <div className="rounded-xl border border-fd-border bg-fd-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-fd-muted-foreground" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-fd-muted-foreground" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-fd-border bg-fd-card shadow-sm">
          <div className="p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
