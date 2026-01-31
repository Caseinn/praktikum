import { cn } from "@/lib/shared/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-fd-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
