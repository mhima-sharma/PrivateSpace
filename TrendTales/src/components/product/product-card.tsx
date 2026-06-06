import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type { Product } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PLATFORMS } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";

export function ProductCard({
  product,
  blogId,
}: {
  product: Product;
  blogId?: string;
}) {
  const platform = PLATFORMS[product.platform];
  const goUrl = `/go/${product.id}${blogId ? `?b=${blogId}` : ""}`;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      <div className="relative aspect-square bg-muted">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
        <Badge
          className="absolute right-2 top-2"
          style={{ backgroundColor: platform.color, color: "white" }}
        >
          {platform.label}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-medium leading-snug">{product.name}</h3>
        {product.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          {product.price != null && (
            <span className="text-lg font-bold text-primary">
              {formatPrice(product.price.toString(), product.currency)}
            </span>
          )}
        </div>
        <a
          href={goUrl}
          target="_blank"
          rel="nofollow sponsored noopener"
          className={cn(buttonVariants({ variant: "brand" }), "w-full")}
        >
          {platform.buyLabel}
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
