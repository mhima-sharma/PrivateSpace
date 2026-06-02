import { cn } from "@/lib/utils";

/**
 * Lightweight loading placeholder. Uses the `.skeleton` utility (muted pulse)
 * so loading states feel intentional instead of a bare spinner.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("skeleton", className)} {...props} />;
}
