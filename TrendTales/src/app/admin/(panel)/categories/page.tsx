import { PageHeader } from "@/components/admin/page-header";
import { CategoryManager } from "@/components/admin/category-manager";
import { getAllCategories } from "@/services/category.service";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories();
  return (
    <div>
      <PageHeader title="Categories" description="Organize your content into categories." />
      <CategoryManager categories={categories} />
    </div>
  );
}
