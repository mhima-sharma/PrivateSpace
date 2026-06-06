import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-heading text-6xl font-extrabold text-gradient">404</p>
      <h1 className="font-heading text-2xl font-bold">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/" className={buttonVariants({ variant: "brand" })}>
        Back to home
      </Link>
    </div>
  );
}
