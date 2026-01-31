import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Plus, FileSpreadsheet } from "lucide-react";

export default function AdminStudentsLoading() {
  return (
    <div className="relative space-y-6 p-4 sm:p-6 animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-fd-border bg-fd-card p-5 shadow-sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-8 w-16" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-fd-border bg-fd-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fd-border p-4">
          <Skeleton className="h-10 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-fd-border pb-3 last:border-0"
              >
                <Skeleton className="h-4 w-32 font-mono" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-8 w-16 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
