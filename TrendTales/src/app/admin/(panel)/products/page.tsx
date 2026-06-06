import { PageHeader } from "@/components/admin/page-header";
import { ProductManager } from "@/components/admin/product-manager";
import { getAllProducts } from "@/services/product.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, blogs] = await Promise.all([
    getAllProducts(),
    prisma.blog.findMany({ select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const serializedProducts = products.map((product) => ({
    ...product,
    price: product.price != null ? Number(product.price) : null,
  }));

  return (
    <div>
      <PageHeader title="Affiliate Products" description="Manage products and track their clicks." />
      <ProductManager products={serializedProducts} blogs={blogs} />
    </div>
  );
}
