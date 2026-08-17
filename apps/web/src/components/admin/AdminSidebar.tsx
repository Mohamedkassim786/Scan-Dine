import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const mainLinks = [
    { label: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
    { label: 'Orders', icon: 'restaurant', path: '/admin/orders' },
    { label: 'Payments', icon: 'payments', path: '/admin/payments' },
  ];

  const menuSubLinks = [
    { label: 'Categories', icon: 'category', path: '/admin/categories' },
    { label: 'Food Items', icon: 'restaurant_menu', path: '/admin/menu' },
    { label: 'Add-ons', icon: 'extension', path: '/admin/addons' },
  ];

  const operationalLinks = [
    { label: 'Tables', icon: 'table_restaurant', path: '/admin/tables' },
    { label: 'QR Codes', icon: 'qr_code_2', path: '/admin/qr-codes' },
    { label: 'Chefs', icon: 'skillet', path: '/admin/chefs' },
    { label: 'Analytics', icon: 'analytics', path: '/admin/analytics' },
    { label: 'AI Insights', icon: 'auto_awesome', path: '/admin/ai-insights' },
    { label: 'Reports', icon: 'summarize', path: '/admin/reports' },
    { label: 'Restaurant', icon: 'storefront', path: '/admin/restaurant' },
    { label: 'Staff', icon: 'group', path: '/admin/staff' },
    { label: 'Notifications', icon: 'notifications', path: '/admin/notifications' },
    { label: 'Audit Logs', icon: 'history', path: '/admin/audit-logs' },
    { label: 'Settings', icon: 'settings', path: '/admin/settings' },
    { label: 'Admin Profile', icon: 'account_circle', path: '/admin/profile' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0d0e0f] z-50 flex flex-col border-r border-[#4f4539]/20 shadow-2xl">
      {/* Brand Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-[#4f4539]/20">
        <div className="flex items-center gap-2.5">
          <img
            src="https://lh3.googleusercontent.com/aida/AP1WRLschiOZ0NVcE0OBlkc9Ry8PdhCC_xP8tOOAdTw8D9egbzKblxBr2Q5vJ4_q8q2LnNXjsbXFLijeI_9Mwu0aAjpQAEJnox-qFfmwjtXkXAPokPZ8ahk1arQG0Rfcbu2nV58Vd9D4yrqCY9tg1Ig7GefYRUtX9qDUUjM0Ajvss2AYmmLq6zUvCBkMcbzHDp0gQrag42ljh_wuMBLwJg9IM1bumqKAQn6mA5lmeRPHQRr7RjxckxrT1KIskXw"
            alt="Brand Logo"
            className="h-7 w-auto object-contain"
          />
          <div>
            <span className="font-serif-heading font-bold text-sm text-[#edbf7b] tracking-wider block">
              SCAN & DINE
            </span>
            <span className="text-[9px] uppercase font-bold text-[#d2c4b4]/60 tracking-widest block">
              Admin Portal
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links (Scrollable) */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto hide-scrollbar">
        {/* Main Links */}
        {mainLinks.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-[#edbf7b] text-[#442b00] font-bold shadow-md'
                  : 'text-[#d2c4b4] hover:bg-[#1f2020] hover:text-[#e3e2e2]'
              }`
            }
          >
            <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Menu Collapsible Group */}
        <div className="pt-1">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-[#d2c4b4] hover:bg-[#1f2020] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[19px] text-[#edbf7b]">menu_book</span>
              <span>Menu</span>
            </div>
            <span
              className={`material-symbols-outlined text-[16px] text-[#9b8f80] transition-transform duration-200 ${
                isMenuOpen ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </button>

          {isMenuOpen && (
            <div className="pl-6 pr-1 py-1 space-y-1 border-l border-[#4f4539]/30 ml-4 my-1">
              {menuSubLinks.map((sub) => (
                <NavLink
                  key={sub.path}
                  to={sub.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#edbf7b]/20 text-[#edbf7b] font-bold'
                        : 'text-[#d2c4b4]/80 hover:bg-[#1f2020] hover:text-[#e3e2e2]'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[16px]">{sub.icon}</span>
                  <span>{sub.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Operational Links */}
        {operationalLinks.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-[#edbf7b] text-[#442b00] font-bold shadow-md'
                  : 'text-[#d2c4b4] hover:bg-[#1f2020] hover:text-[#e3e2e2]'
              }`
            }
          >
            <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-[#4f4539]/20 bg-[#121414]/50">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="min-w-0">
            <p className="font-semibold text-xs text-[#e3e2e2] truncate">{user?.name || 'Julian Vance'}</p>
            <p className="text-[10px] text-[#d2c4b4]/60 truncate">{user?.email || 'admin@aurelian.com'}</p>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-[#edbf7b]/20 text-[#edbf7b] text-[9px] font-bold uppercase">
            Admin
          </span>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/admin/login');
          }}
          className="w-full h-9 rounded-xl bg-[#1f2020] hover:bg-rose-950/40 border border-[#4f4539]/40 hover:border-rose-500/40 text-xs font-semibold text-[#d2c4b4] hover:text-rose-300 flex items-center justify-center gap-2 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
