// src/app/(dashboard)/categories/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { CategoriesView } from "@/components/categories/CategoriesView";

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;

  const rows = await db
    .select({
      id: schema.categories.id,
      name: schema.categories.name,
      description: schema.categories.description,
      itemCount: count(schema.items.id),
    })
    .from(schema.categories)
    .leftJoin(schema.items, eq(schema.items.categoryId, schema.categories.id))
    .groupBy(schema.categories.id)
    .orderBy(schema.categories.name);

  return <CategoriesView categories={rows} />;
}
