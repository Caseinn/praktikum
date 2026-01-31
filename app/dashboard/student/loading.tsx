import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export default function StudentDashboardLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-up">
      <div className="grid gap-3 grid-cols-3 sm:grid-cols-3">
        {[CheckCircle2, Clock, XCircle].map((Icon, i) => (
          <div key={i} className="rounded-xl border border-fd-border bg-fd-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-3 w-16" />
              <Icon className="h-4 w-4 text-fd-muted-foreground" />
            </div>
            <Skeleton className="h-7 w-8" />
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-fd-border bg-fd-card p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-fd-border bg-fd-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
