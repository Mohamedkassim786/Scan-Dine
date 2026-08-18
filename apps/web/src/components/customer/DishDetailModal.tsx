import React, { useState } from 'react';
import { MenuItem } from '../../types';
import { useCustomerStore } from '../../store/useCustomerStore';
import { formatImageUrl } from '../../utils/image';

interface DishDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export const DishDetailModal: React.FC<DishDetailModalProps> = ({ item, onClose }) => {
  const { addToCart } = useCustomerStore();
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<{ [key: string]: boolean }>({});
  const [isAdded, setIsAdded] = useState(false);

  if (!item) return null;

  const addonsList = [
    { id: 'truffle', name: 'Fresh Winter Truffle Shavings', price: 150.00 },
    { id: 'parm', name: 'Aged Parmigiano-Reggiano Crisp', price: 80.00 },
    { id: 'gf', name: 'Gluten-Free Alternative Prep', price: 50.00 },
  ];

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addonsTotal = Object.keys(selectedAddons).reduce((sum, key) => {
    if (!selectedAddons[key]) return sum;
    const found = addonsList.find((a) => a.id === key);
    return sum + (found ? found.price : 0);
  }, 0);

  const totalPrice = (item.price + addonsTotal) * quantity;

  const handleAddToCart = async () => {
    try {
      const notes = [
        ...Object.keys(selectedAddons)
          .filter((k) => selectedAddons[k])
          .map((k) => addonsList.find((a) => a.id === k)?.name),
        specialInstructions.trim(),
      ]
        .filter(Boolean)
        .join(' | ');

      await addToCart(item.id, quantity, notes);
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-[#121414] rounded-3xl border border-[#4f4539]/30 shadow-2xl overflow-hidden flex flex-col text-[#e3e2e2]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-[#121414]/80 text-[#e3e2e2] hover:text-[#edbf7b] flex items-center justify-center backdrop-blur-md border border-[#4f4539]/30"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto hide-scrollbar pb-28">
          {/* Dish Hero Image */}
          <div className="relative w-full h-64 sm:h-72 bg-[#1f2020]">
            <img
              src={formatImageUrl(item.imageUrl)}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e: any) => {
                e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121414] via-transparent to-transparent" />

            {item.isChefPick && (
              <div className="absolute bottom-4 right-4 bg-[#121414]/90 backdrop-blur-md rounded-full px-3.5 py-1.5 flex items-center gap-1.5 border border-[#edbf7b]/40 shadow-lg">
                <span className="material-symbols-outlined text-[#edbf7b] text-[16px]">workspace_premium</span>
                <span className="text-[11px] font-bold text-[#edbf7b] uppercase tracking-wider">Chef's Pick</span>
              </div>
            )}
          </div>

          {/* Dish Information */}
          <div className="px-5 pt-4 space-y-5">
            <div>
              <div className="flex justify-between items-start gap-4">
                <h2 className="font-serif-heading text-2xl font-bold text-[#e3e2e2] leading-tight">
                  {item.name}
                </h2>
                <span className="font-serif-heading text-2xl font-bold text-[#edbf7b] whitespace-nowrap">
                  ₹{item.price.toFixed(2)}
                </span>
              </div>
              <p className="text-[#d2c4b4] text-sm leading-relaxed mt-2.5">
                {item.description}
              </p>
            </div>

            {/* Quick Stats Bento */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-[#1f2020] rounded-xl flex flex-col items-center justify-center border border-[#4f4539]/20">
                <span className="material-symbols-outlined text-[#c8c6c2] text-[20px]">timer</span>
                <span className="text-[11px] font-semibold text-[#d2c4b4] uppercase tracking-wider mt-1">
                  {item.prepTime} Mins
                </span>
              </div>
              <div className="p-3 bg-[#1f2020] rounded-xl flex flex-col items-center justify-center border border-[#4f4539]/20">
                <span className="material-symbols-outlined text-[#c8c6c2] text-[20px]">local_fire_department</span>
                <span className="text-[11px] font-semibold text-[#d2c4b4] uppercase tracking-wider mt-1 capitalize">
                  {item.spiceLevel}
                </span>
              </div>
              <div className="p-3 bg-[#1f2020] rounded-xl flex flex-col items-center justify-center border border-[#4f4539]/20">
                <span className="material-symbols-outlined text-[#c8c6c2] text-[20px]">monitor_weight</span>
                <span className="text-[11px] font-semibold text-[#d2c4b4] uppercase tracking-wider mt-1">
                  {item.calories} Cal
                </span>
              </div>
            </div>

            {/* Ingredients */}
            {item.ingredients && (
              <div className="space-y-1.5">
                <h4 className="font-serif-heading text-sm font-semibold text-[#e3e2e2]">Key Ingredients</h4>
                <p className="text-xs text-[#d2c4b4]/80 leading-relaxed">{item.ingredients}</p>
              </div>
            )}

            {/* Dietary & Allergens */}
            {item.allergens && (
              <div className="space-y-2">
                <h4 className="text-[11px] uppercase tracking-widest text-[#d2c4b4]/70 font-semibold">
                  Dietary & Allergens
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded bg-[#bd9354]/20 border border-[#edbf7b]/30 text-[#edbf7b] text-[10px] font-bold uppercase tracking-wider">
                    {item.dietaryType.toUpperCase()}
                  </span>
                  {item.allergens.split(',').map((alg) => (
                    <span
                      key={alg}
                      className="px-2.5 py-1 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[10px] font-medium tracking-wider"
                    >
                      Contains {alg.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Enhancements / Addons */}
            <div className="space-y-2.5">
              <h4 className="font-serif-heading text-sm font-semibold text-[#e3e2e2]">Enhancements</h4>
              <div className="space-y-2">
                {addonsList.map((addon) => {
                  const isSelected = !!selectedAddons[addon.id];
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#343535] border-[#edbf7b]'
                          : 'bg-[#1f2020] border-[#4f4539]/20 hover:border-[#4f4539]/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                            isSelected ? 'bg-[#edbf7b] border-[#edbf7b]' : 'border-[#9b8f80]'
                          }`}
                        >
                          {isSelected && (
                            <span className="material-symbols-outlined text-[#442b00] text-[12px] font-bold">
                              check
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#e3e2e2]">{addon.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-[#edbf7b]">+₹{addon.price.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Special Instructions */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-[#d2c4b4]">Special Instructions</h4>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="E.g., Less spicy, dressing on the side..."
                className="w-full bg-[#1f2020] border border-[#4f4539]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#e3e2e2] placeholder-[#d2c4b4]/40 focus:outline-none focus:border-[#edbf7b]"
              />
            </div>
          </div>
        </div>

        {/* Sticky Bottom Order Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#121414]/95 backdrop-blur-xl border-t border-[#4f4539]/30 flex items-center gap-3 z-30 pb-safe">
          {/* Quantity Stepper */}
          <div className="flex items-center bg-[#1f2020] rounded-full border border-[#4f4539]/40 h-12 px-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={item.isAvailable === false}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#d2c4b4] hover:text-[#e3e2e2] disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
            <span className="w-8 text-center font-bold text-sm text-[#e3e2e2]">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              disabled={item.isAvailable === false}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#d2c4b4] hover:text-[#e3e2e2] disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>

          {/* Add to Order CTA */}
          <button
            onClick={handleAddToCart}
            disabled={isAdded || item.isAvailable === false}
            className={`flex-1 h-12 rounded-full font-semibold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
              item.isAvailable === false
                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 cursor-not-allowed'
                : isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] active:scale-98'
            }`}
          >
            {item.isAvailable === false ? (
              <>
                <span className="material-symbols-outlined text-[18px]">block</span>
                <span>Currently Unavailable</span>
              </>
            ) : isAdded ? (
              <>
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Added to Order</span>
              </>
            ) : (
              <>
                <span>Add to Order</span>
                <span>•</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
