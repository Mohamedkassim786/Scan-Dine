import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Category, MenuItem } from '../../types';

export const AdminMenuPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('420.00');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dietaryType, setDietaryType] = useState('non-veg');
  const [spiceLevel, setSpiceLevel] = useState('mild');
  const [prepTime, setPrepTime] = useState('15');
  const [calories, setCalories] = useState('500');
  const [ingredients, setIngredients] = useState('');
  const [allergens, setAllergens] = useState('');
  const [isChefPick, setIsChefPick] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  // Image Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, menuRes] = await Promise.all([
        api.get('/categories'),
        api.get('/menu'),
      ]);
      setCategories(catRes.data);
      setMenuItems(menuRes.data);
      if (catRes.data.length > 0 && !categoryId) {
        setCategoryId(catRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress('Uploading to server...');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.url) {
        // Automatically set the image URL
        setImageUrl(res.data.url);
        setUploadProgress('Uploaded successfully ✓');
        setTimeout(() => setUploadProgress(''), 2500);
      }
    } catch (err: any) {
      console.error('File upload failed:', err);
      setUploadProgress(err.response?.data?.error || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setPrice('420.00');
    setImageUrl('https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80');
    setDietaryType('non-veg');
    setSpiceLevel('mild');
    setPrepTime('15');
    setCalories('500');
    setIngredients('');
    setAllergens('');
    setIsChefPick(false);
    setIsPopular(false);
    setIsFeatured(false);
    setUploadProgress('');
    setIsModalOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description);
    setPrice(item.price.toString());
    setImageUrl(item.imageUrl);
    setCategoryId(item.categoryId);
    setDietaryType(item.dietaryType);
    setSpiceLevel(item.spiceLevel);
    setPrepTime(item.prepTime.toString());
    setCalories(item.calories.toString());
    setIngredients(item.ingredients || '');
    setAllergens(item.allergens || '');
    setIsChefPick(item.isChefPick);
    setIsPopular(item.isPopular);
    setIsFeatured(item.isFeatured || false);
    setUploadProgress('');
    setIsModalOpen(true);
  };

  const handleDuplicate = async (item: MenuItem) => {
    try {
      await api.post(`/menu/${item.id}/duplicate`, {});
      fetchData();
    } catch (err) {
      console.error('Failed to duplicate dish:', err);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        categoryId: categoryId || categories[0]?.id,
        dietaryType,
        spiceLevel,
        prepTime: parseInt(prepTime) || 15,
        calories: parseInt(calories) || 0,
        ingredients,
        allergens,
        isChefPick,
        isPopular,
        isFeatured,
      };

      if (editingItem) {
        await api.put(`/menu/${editingItem.id}`, payload);
      } else {
        await api.post('/menu', payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      await api.patch(`/menu/${id}/availability`, { isAvailable: !current });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await api.delete(`/menu/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = selectedCat === 'all' ? menuItems : menuItems.filter((i) => i.categoryId === selectedCat);

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="Menu Recipe & Food Management" />

        <main className="pt-16 p-8 space-y-6 max-w-7xl w-full">
          {/* Header Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4f4539]/20 pb-4">
            <div>
              <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
                Food Items & Dishes
              </h1>
              <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
                Manage seasonal recipes, Rupee (₹) pricing, direct photo uploads, 86 availability, and allergens
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Create New Dish</span>
            </button>
          </div>

          {/* Categories Tab Filter */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 py-1">
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                selectedCat === 'all' ? 'bg-[#edbf7b] text-[#442b00]' : 'bg-[#1f2020] text-[#d2c4b4] border border-[#4f4539]/30'
              }`}
            >
              All Selections ({menuItems.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                  selectedCat === c.id ? 'bg-[#edbf7b] text-[#442b00]' : 'bg-[#1f2020] text-[#d2c4b4] border border-[#4f4539]/30'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Items Table List */}
          <div className="bg-[#1f2020] rounded-2xl border border-[#4f4539]/20 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#4f4539]/30 text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60 bg-[#121414]/40">
                    <th className="p-4">Dish</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Dietary & Badges</th>
                    <th className="p-4">Availability</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#4f4539]/15">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#121414]/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-[#121414]" />
                          <div>
                            <p className="font-serif-heading font-semibold text-sm text-[#e3e2e2]">{item.name}</p>
                            <p className="text-[11px] text-[#d2c4b4]/60 truncate max-w-xs">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-[#d2c4b4]">{item.category?.name || 'General'}</td>
                      <td className="p-4 font-bold text-[#edbf7b] text-sm">₹{item.price.toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#bd9354]/20 text-[#edbf7b] border border-[#edbf7b]/30">
                            {item.dietaryType}
                          </span>
                          {item.isChefPick && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 text-[9px] font-bold uppercase border border-amber-500/30">
                              Chef's Pick
                            </span>
                          )}
                          {item.isPopular && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 text-[9px] font-bold uppercase border border-blue-500/30">
                              Popular
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleAvailability(item.id, item.isAvailable)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            item.isAvailable ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {item.isAvailable ? 'Available' : '86 / Sold Out'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDuplicate(item)}
                            className="p-1.5 rounded-lg bg-[#121414] text-[#d2c4b4] hover:text-[#edbf7b]"
                            title="Duplicate Dish"
                          >
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 rounded-lg bg-[#121414] text-[#d2c4b4] hover:text-[#edbf7b]"
                            title="Edit Dish"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-lg bg-[#121414] text-[#d2c4b4] hover:text-rose-400"
                            title="Delete Dish"
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

      {/* Dish Modal with Direct Image File Uploader */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl bg-[#1f2020] rounded-3xl border border-[#4f4539]/30 p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto hide-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-[#4f4539]/30">
              <h2 className="font-serif-heading text-lg font-bold text-[#edbf7b]">
                {editingItem ? 'Edit Dish Recipe' : 'Create New Menu Item'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#9b8f80] hover:text-[#e3e2e2]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Dish Title</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Wagyu Ribeye"
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Price (₹ INR)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] font-bold border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">Gastronomy Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Seasonal description, cut, tasting notes..."
                  className="w-full bg-[#121414] rounded-xl p-3 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-3 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Dietary Type</label>
                  <select
                    value={dietaryType}
                    onChange={(e) => setDietaryType(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-3 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="non-veg">Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload & Preview Section */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-[#121414] border border-[#4f4539]/30">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#edbf7b] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[17px]">photo_camera</span>
                    <span>Dish Photo & Media</span>
                  </label>
                  {uploadProgress && (
                    <span className="text-[10px] font-bold text-emerald-400">{uploadProgress}</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Thumbnail Preview */}
                  <div className="w-16 h-16 rounded-xl bg-[#1f2020] border border-[#4f4539]/40 overflow-hidden shrink-0 flex items-center justify-center">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[#4f4539] text-[24px]">image</span>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-3 py-1.5 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-md transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">upload</span>
                        <span>{isUploading ? 'Uploading...' : 'Upload Photo'}</span>
                      </button>
                    </div>

                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Or paste external image URL (https://...)"
                      className="w-full h-8 bg-[#1f2020] rounded-lg px-2.5 text-[11px] text-[#e3e2e2] border border-[#4f4539]/30 focus:outline-none focus:border-[#edbf7b]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Spice Level</label>
                  <select
                    value={spiceLevel}
                    onChange={(e) => setSpiceLevel(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-2 text-[#e3e2e2] border border-[#4f4539]/40"
                  >
                    <option value="none">None</option>
                    <option value="mild">Mild</option>
                    <option value="medium">Medium</option>
                    <option value="hot">Hot</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Prep Time (m)</label>
                  <input
                    type="number"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-3 text-[#e3e2e2] border border-[#4f4539]/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Calories</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-3 text-[#e3e2e2] border border-[#4f4539]/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Ingredients</label>
                  <input
                    type="text"
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    placeholder="Flour, Eggs, Truffle..."
                    className="w-full h-10 bg-[#121414] rounded-xl px-3 text-[#e3e2e2] border border-[#4f4539]/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Allergens</label>
                  <input
                    type="text"
                    value={allergens}
                    onChange={(e) => setAllergens(e.target.value)}
                    placeholder="Dairy, Gluten, Nuts..."
                    className="w-full h-10 bg-[#121414] rounded-xl px-3 text-[#e3e2e2] border border-[#4f4539]/40"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isChefPick} onChange={(e) => setIsChefPick(e.target.checked)} className="w-4 h-4 accent-[#edbf7b]" />
                  <span className="text-[#e3e2e2] font-semibold">Chef's Pick Badge</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} className="w-4 h-4 accent-[#edbf7b]" />
                  <span className="text-[#e3e2e2] font-semibold">Popular Badge</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4 accent-[#edbf7b]" />
                  <span className="text-[#e3e2e2] font-semibold">Featured on Hero</span>
                </label>
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
                  className="flex-1 h-11 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider shadow-lg"
                >
                  Save Menu Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
