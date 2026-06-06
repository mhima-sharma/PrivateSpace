import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface CategoryCardProps {
  category: {
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    _count?: { blogs: number };
  };
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative block aspect-[4/3] overflow-hidden rounded-xl"
    >
      {category.image ? (
        <Image
          src={category.image}
          alt={category.name}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />
      ) : (
        <div className="h-full w-full gradient-brand" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 space-y-1 p-4 text-white">
        <h3 className="font-heading text-lg font-bold">{category.name}</h3>
        {category._count && (
          <Badge variant="secondary" className="text-xs">
            {category._count.blogs} {category._count.blogs === 1 ? "post" : "posts"}
          </Badge>
        )}
      </div>
    </Link>
  );
}
