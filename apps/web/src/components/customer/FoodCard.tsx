import React, { useState } from 'react';
import { MenuItem } from '../../types';
import { useCustomerStore } from '../../store/useCustomerStore';
import { formatImageUrl } from '../../utils/image';

interface FoodCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ item, onSelect }) => {
  const { addToCart } = useCustomerStore();
  const [isAdding, setIsAdding] = useState(false);
  const isAvailable = item.isAvailable !== false;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;
    setIsAdding(true);
    try {
      await addToCart(item.id, 1);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsAdding(false), 500);
    }
  };

  return (
    <div
      onClick={() => onSelect(item)}
      className={`group relative flex flex-col rounded-xl overflow-hidden border transition-all duration-300 shadow-md cursor-pointer ${
        isAvailable
          ? 'bg-[#1f2020] border-[#4f4539]/25 hover:border-[#edbf7b]/40 hover:shadow-xl'
          : 'bg-[#181515] border-rose-500/30 opacity-80'
      }`}
    >
      {/* Food Image */}
      <div className="relative w-full aspect-[4/3] bg-[#121414] overflow-hidden">
        <img
          src={formatImageUrl(item.imageUrl)}
          alt={item.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isAvailable ? 'group-hover:scale-105' : 'grayscale opacity-60'
          }`}
          loading="lazy"
          onError={(e: any) => {
            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f2020] via-transparent to-transparent opacity-80" />

        {/* Unavailable Banner Overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-2 z-20">
            <span className="px-3 py-1.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-rose-300 text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 animate-pulse">
              <span className="material-symbols-outlined text-[16px]">block</span>
              <span>Currently Unavailable</span>
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          {item.isChefPick && (
            <span className="px-2 py-0.5 rounded bg-[#edbf7b] text-[#442b00] text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">star</span>
              Chef's Pick
            </span>
          )}
          {item.isPopular && !item.isChefPick && (
            <span className="px-2 py-0.5 rounded bg-[#bd9354]/90 text-[#ffddb0] text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md">
              Popular
            </span>
          )}
        </div>

        <div className="absolute top-2.5 right-2.5 z-10">
          {item.dietaryType === 'veg' ? (
            <span className="w-5 h-5 rounded border border-green-500 bg-[#121414]/80 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-green-500" />
            </span>
          ) : item.dietaryType === 'vegan' ? (
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 text-[9px] font-bold uppercase">
              VEGAN
            </span>
          ) : (
            <span className="w-5 h-5 rounded border border-rose-500 bg-[#121414]/80 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            </span>
          )}
        </div>

        {/* Price Tag Overlay in Rupees */}
        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-md bg-[#121414]/90 border border-[#4f4539]/40 backdrop-blur-md">
          <span className="font-serif-heading font-bold text-[#edbf7b] text-sm">
            ₹{item.price.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-serif-heading text-base font-semibold text-[#e3e2e2] group-hover:text-[#edbf7b] transition-colors leading-snug line-clamp-1">
            {item.name}
          </h4>
          <p className="text-[#d2c4b4]/75 text-xs mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        <div className="mt-3.5 pt-2.5 border-t border-[#4f4539]/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-[#d2c4b4]/60">
            <span className="flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px]">timer</span>
              {item.prepTime}m
            </span>
            {item.spiceLevel !== 'none' && (
              <span className="flex items-center text-amber-400">
                <span className="material-symbols-outlined text-[13px]">local_fire_department</span>
                <span className="capitalize">{item.spiceLevel}</span>
              </span>
            )}
          </div>

          {isAvailable ? (
            <button
              onClick={handleQuickAdd}
              disabled={isAdding}
              className="px-3 py-1.5 rounded-full bg-[#edbf7b]/10 hover:bg-[#edbf7b] text-[#edbf7b] hover:text-[#442b00] border border-[#edbf7b]/30 font-semibold text-xs tracking-wider uppercase transition-all duration-200 flex items-center gap-1 active:scale-95"
            >
              {isAdding ? (
                <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
              ) : (
                <>
                  <span>Add</span>
                  <span className="material-symbols-outlined text-[14px]">add</span>
                </>
              )}
            </button>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-rose-950/50 text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
              Unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
