import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { MenuItem } from '../../types';

export const AdminAddonsPage: React.FC = () => {
  const [addonGroups, setAddonGroups] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);

  // Group Form
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [minSelections, setMinSelections] = useState('0');
  const [maxSelections, setMaxSelections] = useState('1');
  const [isRequired, setIsRequired] = useState(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');

  // Option Form
  const [activeGroupId, setActiveGroupId] = useState('');
  const [optionName, setOptionName] = useState('');
  const [optionPrice, setOptionPrice] = useState('50.00');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groupsRes, menuRes] = await Promise.all([
        api.get('/addons'),
        api.get('/menu'),
      ]);
      setAddonGroups(groupsRes.data);
      setMenuItems(menuRes.data);
      if (menuRes.data.length > 0 && !selectedMenuItemId) {
        setSelectedMenuItemId(menuRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/addons/groups', {
        name: groupName,
        description: groupDesc,
        minSelections: parseInt(minSelections) || 0,
        maxSelections: parseInt(maxSelections) || 1,
        isRequired,
        menuItemId: selectedMenuItemId,
      });

      setIsGroupModalOpen(false);
      setGroupName('');
      setGroupDesc('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId) return;
    try {
      await api.post('/addons/options', {
        addonGroupId: activeGroupId,
        name: optionName,
        price: parseFloat(optionPrice) || 0,
      });

      setIsOptionModalOpen(false);
      setOptionName('');
      setOptionPrice('50.00');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!window.confirm('Delete this add-on group and all its options?')) return;
    try {
      await api.delete(`/addons/groups/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    try {
      await api.delete(`/addons/options/${optionId}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="Food Customizations & Add-ons" />

        <main className="pt-16 p-8 space-y-6 max-w-6xl w-full">
          {/* Header Action */}
          <div className="flex items-center justify-between border-b border-[#4f4539]/20 pb-4">
            <div>
              <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
                Dish Add-ons & Modifiers
              </h1>
              <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
                Configure portion sizes, gourmet enhancements, extra toppings, and required/optional dish modifiers
              </p>
            </div>

            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Create Add-on Group</span>
            </button>
          </div>

          {/* Add-on Groups List */}
          {addonGroups.length === 0 ? (
            <div className="p-16 rounded-2xl bg-[#1f2020] border border-[#4f4539]/20 text-center space-y-3">
              <span className="material-symbols-outlined text-[44px] text-[#4f4539]">extension</span>
              <p className="text-sm font-semibold text-[#e3e2e2]">No Add-on Groups Configured</p>
              <p className="text-xs text-[#d2c4b4]/60">Create modifiers such as portion sizes, toppings, and sauces.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {addonGroups.map((group) => (
                <div
                  key={group.id}
                  className="p-5 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-4 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start pb-3 border-b border-[#4f4539]/20">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif-heading font-bold text-base text-[#edbf7b]">
                            {group.name}
                          </h3>
                          {group.isRequired ? (
                            <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[9px] font-bold uppercase">
                              Required
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-neutral-900 border border-[#4f4539]/40 text-[#d2c4b4]/60 text-[9px] font-bold uppercase">
                              Optional
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-[#e3e2e2] mt-1">
                          Attached to: <span className="text-[#edbf7b]">{group.menuItem?.name || 'All'}</span>
                        </p>
                        <p className="text-[11px] text-[#d2c4b4]/60 mt-0.5">
                          Min: {group.minSelections} • Max: {group.maxSelections}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-[#9b8f80] hover:text-rose-400 p-1"
                        title="Delete Group"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>

                    {/* Options List */}
                    <div className="space-y-2 pt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60">
                        Modifier Options ({group.options.length})
                      </p>

                      {group.options.length === 0 ? (
                        <p className="text-xs text-[#d2c4b4]/40 italic py-2">No options added yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {group.options.map((opt: any) => (
                            <div
                              key={opt.id}
                              className="p-2.5 rounded-xl bg-[#121414] border border-[#4f4539]/30 flex items-center justify-between text-xs"
                            >
                              <span className="text-[#e3e2e2] font-medium">{opt.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-[#edbf7b]">
                                  {opt.price === 0 ? 'Free' : `+₹${opt.price.toFixed(2)}`}
                                </span>
                                <button
                                  onClick={() => handleDeleteOption(opt.id)}
                                  className="text-[#9b8f80] hover:text-rose-400"
                                >
                                  <span className="material-symbols-outlined text-[15px]">close</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add Option Trigger */}
                  <button
                    onClick={() => {
                      setActiveGroupId(group.id);
                      setIsOptionModalOpen(true);
                    }}
                    className="w-full py-2 rounded-xl bg-[#121414] hover:bg-[#343535] border border-[#edbf7b]/30 text-[#edbf7b] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Add New Option</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#1f2020] rounded-3xl border border-[#edbf7b]/40 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#4f4539]/30">
              <h3 className="font-serif-heading text-lg font-bold text-[#edbf7b]">
                Create Add-on Group
              </h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-[#9b8f80] hover:text-[#e3e2e2]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">Select Dish</label>
                <select
                  value={selectedMenuItemId}
                  onChange={(e) => setSelectedMenuItemId(e.target.value)}
                  className="w-full h-10 bg-[#121414] rounded-xl px-3 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                >
                  {menuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (₹{item.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">Group Name</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Portion Size, Extra Toppings, Sauce"
                  className="w-full h-10 bg-[#121414] rounded-xl px-3 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Min Selections</label>
                  <input
                    type="number"
                    min="0"
                    value={minSelections}
                    onChange={(e) => setMinSelections(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-3 text-[#e3e2e2] border border-[#4f4539]/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Max Selections</label>
                  <input
                    type="number"
                    min="1"
                    value={maxSelections}
                    onChange={(e) => setMaxSelections(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-3 text-[#e3e2e2] border border-[#4f4539]/40"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="w-4 h-4 accent-[#edbf7b]"
                />
                <span className="text-[#e3e2e2] font-semibold">Required Choice (Customer must pick an option)</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-[#121414] text-[#d2c4b4] font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-[#edbf7b] text-[#442b00] font-bold uppercase tracking-wider shadow-lg"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Option Modal */}
      {isOptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#1f2020] rounded-3xl border border-[#edbf7b]/40 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#4f4539]/30">
              <h3 className="font-serif-heading text-lg font-bold text-[#edbf7b]">
                Add Modifier Option
              </h3>
              <button onClick={() => setIsOptionModalOpen(false)} className="text-[#9b8f80] hover:text-[#e3e2e2]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddOption} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">Option Name</label>
                <input
                  type="text"
                  required
                  value={optionName}
                  onChange={(e) => setOptionName(e.target.value)}
                  placeholder="e.g. Extra Winter Truffle (5g)"
                  className="w-full h-10 bg-[#121414] rounded-xl px-3 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">Price (+₹ INR, 0 for Free)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={optionPrice}
                  onChange={(e) => setOptionPrice(e.target.value)}
                  className="w-full h-10 bg-[#121414] rounded-xl px-3 text-[#e3e2e2] border border-[#4f4539]/40"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOptionModalOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-[#121414] text-[#d2c4b4] font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-[#edbf7b] text-[#442b00] font-bold uppercase tracking-wider shadow-lg"
                >
                  Add Option
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
