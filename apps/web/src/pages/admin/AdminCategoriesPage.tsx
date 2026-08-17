import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Category } from '../../types';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCat(null);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleEdit = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCat) {
        await api.put(`/categories/${editingCat.id}`, { name, description });
      } else {
        await api.post('/categories', { name, description, displayOrder: categories.length });
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category? Disassociated items will need a new category.')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await api.put(`/categories/${id}`, { isActive: !current });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const list = [...categories];
    const [moved] = list.splice(index, 1);
    list.splice(newIndex, 0, moved);
    setCategories(list);

    try {
      await api.patch('/categories/reorder', {
        orderedIds: list.map((c) => c.id),
      });
    } catch (err) {
      console.error(err);
      fetchCategories();
    }
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="Menu Categories Management" />

        <main className="pt-16 p-8 space-y-6 max-w-5xl w-full">
          {/* Header Action */}
          <div className="flex items-center justify-between border-b border-[#4f4539]/20 pb-4">
            <div>
              <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
                Menu Categories
              </h1>
              <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
                Organize menu taxonomy, set customer navigation display order, and toggle seasonal availability
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>New Category</span>
            </button>
          </div>

          {/* Categories List */}
          <div className="bg-[#1f2020] rounded-2xl border border-[#4f4539]/20 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#4f4539]/30 text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60 bg-[#121414]/40">
                    <th className="p-4">Order</th>
                    <th className="p-4">Category Name</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#4f4539]/15 text-[#e3e2e2]">
                  {categories.map((cat, idx) => (
                    <tr key={cat.id} className="hover:bg-[#121414]/50 transition-colors">
                      {/* Reorder Buttons */}
                      <td className="p-4 w-20">
                        <div className="flex items-center gap-1">
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, 'up')}
                            className="p-1 rounded bg-[#121414] hover:text-[#edbf7b] disabled:opacity-30"
                          >
                            <span className="material-symbols-outlined text-[14px]">expand_less</span>
                          </button>
                          <span className="font-mono text-xs text-[#d2c4b4]/70 font-bold">{idx + 1}</span>
                          <button
                            disabled={idx === categories.length - 1}
                            onClick={() => handleMove(idx, 'down')}
                            className="p-1 rounded bg-[#121414] hover:text-[#edbf7b] disabled:opacity-30"
                          >
                            <span className="material-symbols-outlined text-[14px]">expand_more</span>
                          </button>
                        </div>
                      </td>

                      <td className="p-4 font-serif-heading font-bold text-sm text-[#edbf7b]">
                        {cat.name}
                      </td>

                      <td className="p-4 text-xs text-[#d2c4b4]/70 max-w-sm truncate">
                        {cat.description || '—'}
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#121414] border border-[#4f4539]/30 text-xs font-semibold text-[#e3e2e2]">
                          {(cat as any)._count?.menuItems || 0} Dishes
                        </span>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => handleToggleActive(cat.id, cat.isActive)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            cat.isActive
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {cat.isActive ? 'Active' : 'Hidden'}
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(cat)}
                            className="p-1.5 rounded-lg bg-[#121414] text-[#d2c4b4] hover:text-[#edbf7b] border border-[#4f4539]/30 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="p-1.5 rounded-lg bg-[#121414] text-[#d2c4b4] hover:text-rose-400 border border-[#4f4539]/30 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#1f2020] rounded-3xl border border-[#edbf7b]/40 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#4f4539]/30">
              <h3 className="font-serif-heading text-lg font-bold text-[#edbf7b]">
                {editingCat ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#9b8f80] hover:text-[#e3e2e2]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">Category Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Starters & Crudo, Artisan Pizzas"
                  className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Appetizing summary of selections in this category..."
                  className="w-full bg-[#121414] rounded-xl p-3 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-[#121414] text-[#d2c4b4] font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-[#edbf7b] text-[#442b00] font-bold uppercase tracking-wider shadow-lg"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
