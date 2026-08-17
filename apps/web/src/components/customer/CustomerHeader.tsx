import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCustomerStore } from '../../store/useCustomerStore';

interface CustomerHeaderProps {
  title?: string;
  showBack?: boolean;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({ title = 'Menu', showBack = false }) => {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const { restaurant, table, cart } = useCustomerStore();
  const totalCartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const baseRoute = `/r/${slug}/t/${token}`;

  return (
    <header className="fixed top-0 w-full z-50 glass-header pt-safe">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Back button or Logo + Title */}
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={() => window.history.back()}
              className="w-9 h-9 rounded-full bg-[#1f2020] border border-[#4f4539]/40 flex items-center justify-center text-[#e3e2e2] hover:text-[#edbf7b] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
          ) : (
            <Link to={`${baseRoute}`} className="flex items-center gap-2.5">
              <img
                src={restaurant?.logoUrl || 'https://lh3.googleusercontent.com/aida/AP1WRLschiOZ0NVcE0OBlkc9Ry8PdhCC_xP8tOOAdTw8D9egbzKblxBr2Q5vJ4_q8q2LnNXjsbXFLijeI_9Mwu0aAjpQAEJnox-qFfmwjtXkXAPokPZ8ahk1arQG0Rfcbu2nV58Vd9D4yrqCY9tg1Ig7GefYRUtX9qDUUjM0Ajvss2AYmmLq6zUvCBkMcbzHDp0gQrag42ljh_wuMBLwJg9IM1bumqKAQn6mA5lmeRPHQRr7RjxckxrT1KIskXw'}
                alt="Logo"
                className="h-7 w-auto object-contain"
              />
              <span className="font-serif-heading font-bold text-lg tracking-wide text-[#e3e2e2]">
                {restaurant?.name || 'Aurelian'}
              </span>
            </Link>
          )}

          {showBack && (
            <h1 className="font-serif-heading text-lg font-bold text-[#e3e2e2] ml-1">{title}</h1>
          )}
        </div>

        {/* Right: Table Badge & Cart Icon */}
        <div className="flex items-center gap-3">
          {table?.tableNumber && (
            <div className="px-2.5 py-1 rounded-full bg-[#1f2020] border border-[#edbf7b]/30 flex items-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-[#edbf7b] text-[14px]">table_restaurant</span>
              <span className="text-[11px] font-semibold text-[#edbf7b] tracking-wider uppercase">
                T-{String(table.tableNumber).padStart(2, '0')}
              </span>
            </div>
          )}

          <Link
            to={`${baseRoute}/cart`}
            className="relative w-10 h-10 rounded-full bg-[#1f2020] border border-[#4f4539]/40 flex items-center justify-center text-[#e3e2e2] hover:text-[#edbf7b] transition-all"
            aria-label="View Cart"
          >
            <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#edbf7b] text-[#442b00] font-bold text-[11px] flex items-center justify-center shadow-md animate-pulse">
                {totalCartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};
