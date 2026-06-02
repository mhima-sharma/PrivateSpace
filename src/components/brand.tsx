import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Brand mark. Uses /public/logo.svg — drop in the real logo file at that path
 * to rebrand everywhere at once. Intentionally generic wordmark ("PrivateSpace")
 * so nothing about the event is revealed pre-login.
 */
export function Brand({
  className,
  showWordmark = true,
  size = 32,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/logo.svg"
        alt="PrivateSpace"
        width={size}
        height={size}
        priority
        className="rounded-lg"
      />
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight">
          Private<span className="text-primary">Space</span>
        </span>
      )}
    </span>
  );
}
