// src/server/category-actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function createCategory(input: { name: string; description?: string }) {
  const user = await requireAdmin();
  if (!user) throw new Error("Unauthorized");
  if (input.name.trim().length < 3) throw new Error("Category name must be at least 3 characters.");
  await db.insert(schema.categories).values({ name: input.name.trim(), description: input.description?.trim() || null });
  revalidatePath("/categories");
}

export async function updateCategory(id: number, input: { name?: string; description?: string }) {
  const user = await requireAdmin();
  if (!user) throw new Error("Unauthorized");
  await db.update(schema.categories).set({ name: input.name?.trim(), description: input.description?.trim() }).where(eq(schema.categories.id, id));
  revalidatePath("/categories");
}

export async function deleteCategory(id: number) {
  const user = await requireAdmin();
  if (!user) throw new Error("Unauthorized");
  const inUse = await db.select({ id: schema.items.id }).from(schema.items).where(eq(schema.items.categoryId, id)).limit(1);
  if (inUse.length > 0) throw new Error("Cannot delete category with items. Move items to another category first.");
  await db.delete(schema.categories).where(eq(schema.categories.id, id));
  revalidatePath("/categories");
}
