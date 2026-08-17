import React, { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useCustomerStore } from '../../store/useCustomerStore';

export const CustomerBottomNav: React.FC = () => {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const { cart, session } = useCustomerStore();
  const [orderCount, setOrderCount] = useState<number>(0);
  const cartCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  const base = `/r/${slug}/t/${token}`;

  useEffect(() => {
    const fetchOrderCount = async () => {
      const activeToken = token || session?.token;
      if (!activeToken) return;
      try {
        const res = await api.get(`/orders?sessionToken=${activeToken}`);
        setOrderCount(res.data.length || 0);
      } catch {}
    };

    fetchOrderCount();

    const socket = getSocket();
    socket.on('new-order', fetchOrderCount);
    socket.on('order-status-update', fetchOrderCount);

    const interval = setInterval(fetchOrderCount, 4000);

    return () => {
      socket.off('new-order', fetchOrderCount);
      socket.off('order-status-update', fetchOrderCount);
      clearInterval(interval);
    };
  }, [token, session?.token]);

  const navItems = [
    { label: 'Welcome', icon: 'home', to: base, end: true },
    { label: 'Menu', icon: 'restaurant_menu', to: `${base}/menu` },
    { label: 'Orders', icon: 'receipt_long', to: `${base}/orders`, badge: orderCount },
    { label: 'Cart', icon: 'shopping_bag', to: `${base}/cart`, badge: cartCount },
    { label: 'Dine AI', icon: 'auto_awesome', to: `${base}/assistant`, highlight: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe glass-panel border-t border-[#4f4539]/30">
      <div className="flex justify-around items-center h-16 px-2 max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 transition-all ${
                isActive
                  ? 'text-[#edbf7b] font-semibold scale-105'
                  : 'text-[#d2c4b4]/70 hover:text-[#e3e2e2]'
              }`
            }
          >
            <div className="relative">
              <span
                className={`material-symbols-outlined text-[22px] ${
                  item.highlight ? 'text-[#edbf7b]' : ''
                }`}
              >
                {item.icon}
              </span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-[#edbf7b] text-[#442b00] text-[9px] font-bold flex items-center justify-center shadow-md animate-pulse">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
