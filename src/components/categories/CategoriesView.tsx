// src/components/categories/CategoriesView.tsx
"use client";
import { useState } from "react";
import { Button, Input, Label, Textarea, Modal, Card, EmptyState } from "@/components/ui";
import { Fab } from "@/components/Fab";
import { createCategory, updateCategory, deleteCategory } from "@/server/category-actions";

type Cat = { id: number; name: string; description: string | null; itemCount: number };

export function CategoriesView({ categories }: { categories: Cat[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editCat, setEditCat] = useState<Cat | null>(null);

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold text-gray-900">Categories</h1>
      <Card className="overflow-hidden">
        {categories.length === 0 ? (
          <EmptyState title="No categories yet" hint="Use the + button to create one." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Items</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.description ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{c.itemCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="warning" onClick={() => setEditCat(c)}>Edit</Button>
                        <DeleteBtn id={c.id} name={c.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Fab onClick={() => setAddOpen(true)} label="Add category" />
      {addOpen && <AddModal onClose={() => setAddOpen(false)} />}
      {editCat && <EditModal cat={editCat} onClose={() => setEditCat(null)} />}
    </div>
  );
}

function AddModal({ onClose }: { onClose: () => void }) {
  const [pending, setPending] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const f = new FormData(e.currentTarget);
    try {
      await createCategory({ name: String(f.get("name")), description: String(f.get("description") || "") });
      onClose();
    } catch (err) {
      alert((err as Error).message); setPending(false);
    }
  }
  return (
    <Modal open onClose={onClose} title="Add Category">
      <form onSubmit={submit} className="space-y-4">
        <div><Label>Name *</Label><Input name="name" required placeholder="Min 3 characters" /></div>
        <div><Label>Description</Label><Textarea name="description" rows={2} /></div>
        <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" type="button" onClick={onClose}>Cancel</Button><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Add"}</Button></div>
      </form>
    </Modal>
  );
}

function EditModal({ cat, onClose }: { cat: Cat; onClose: () => void }) {
  const [pending, setPending] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const f = new FormData(e.currentTarget);
    await updateCategory(cat.id, { name: String(f.get("name")), description: String(f.get("description") || "") });
    onClose();
  }
  return (
    <Modal open onClose={onClose} title="Edit Category">
      <form onSubmit={submit} className="space-y-4">
        <div><Label>Name *</Label><Input name="name" required defaultValue={cat.name} /></div>
        <div><Label>Description</Label><Textarea name="description" rows={2} defaultValue={cat.description ?? ""} /></div>
        <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" type="button" onClick={onClose}>Cancel</Button><Button type="submit" disabled={pending}>Save</Button></div>
      </form>
    </Modal>
  );
}

function DeleteBtn({ id, name }: { id: number; name: string }) {
  const [pending, setPending] = useState(false);
  async function run() {
    if (!confirm(`Delete category "${name}"?`)) return;
    setPending(true);
    try { await deleteCategory(id); } catch (e) { alert((e as Error).message); setPending(false); }
  }
  return <Button size="sm" variant="danger" onClick={run} disabled={pending}>{pending ? "…" : "Delete"}</Button>;
}
