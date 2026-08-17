import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useCustomerStore } from '../../store/useCustomerStore';
import { CustomerHeader } from '../../components/customer/CustomerHeader';
import { CustomerBottomNav } from '../../components/customer/CustomerBottomNav';
import { FoodCard } from '../../components/customer/FoodCard';
import { DishDetailModal } from '../../components/customer/DishDetailModal';
import { MenuItem } from '../../types';

export const SearchPage: React.FC = () => {
  const { restaurant } = useCustomerStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('all');
  const [results, setResults] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (restaurant?.id) {
      searchDishes();
    }
  }, [searchTerm, dietaryFilter, restaurant?.id]);

  const searchDishes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('restaurantId', restaurant?.id || '');
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (dietaryFilter !== 'all') params.append('dietary', dietaryFilter);

      const res = await api.get(`/menu?${params.toString()}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] pb-28 pt-16">
      <CustomerHeader title="Explore & Search" showBack />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 space-y-5">
        {/* Search Input Box */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b8f80]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search dishes, ingredients, flavors..."
            className="w-full h-12 bg-[#1f2020] rounded-xl pl-10 pr-10 text-sm text-[#e3e2e2] placeholder-[#d2c4b4]/40 border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9b8f80] hover:text-[#e3e2e2]"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Dietary Filters */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 py-1">
          {[
            { id: 'all', label: 'All Cuisines' },
            { id: 'veg', label: 'Vegetarian' },
            { id: 'vegan', label: 'Vegan' },
            { id: 'non-veg', label: 'Meat & Poultry' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setDietaryFilter(f.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                dietaryFilter === f.id
                  ? 'bg-[#edbf7b] text-[#442b00]'
                  : 'bg-[#1f2020] text-[#d2c4b4] border border-[#4f4539]/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs text-[#d2c4b4]/60">
            <span>Discovered {results.length} dishes</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-48 rounded-xl bg-[#1f2020] animate-pulse" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 text-center text-[#d2c4b4]/60">
              <span className="material-symbols-outlined text-[44px] mb-2 text-[#4f4539]">search_off</span>
              <p className="text-sm font-semibold">No culinary matches found</p>
              <p className="text-xs text-[#d2c4b4]/40 mt-1">Try another ingredient or dish name</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((item) => (
                <FoodCard key={item.id} item={item} onSelect={(dish) => setSelectedDish(dish)} />
              ))}
            </div>
          )}
        </div>
      </main>

      <CustomerBottomNav />
      <DishDetailModal item={selectedDish} onClose={() => setSelectedDish(null)} />
    </div>
  );
};
