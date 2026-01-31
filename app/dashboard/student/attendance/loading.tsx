import { Skeleton } from "@/components/ui/skeleton";
import { Clock, MapPin } from "lucide-react";

export default function Loading() {
  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-up">
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-fd-border bg-fd-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="space-y-2">
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
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
