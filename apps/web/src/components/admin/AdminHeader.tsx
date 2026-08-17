import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../store/useAuthStore';
import { playNotificationChime } from '../../utils/audio';

interface AdminHeaderProps {
  title: string;
}

interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'service';
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ title }) => {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [restaurantSlug, setRestaurantSlug] = useState('aurelian');
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  useEffect(() => {
    fetchNotificationCount();

    api.get('/restaurants').then((res) => {
      if (res.data.length > 0) setRestaurantSlug(res.data[0].slug);
    }).catch(() => {});

    const socket = getSocket();
    if (user?.restaurantId) {
      socket.emit('join-admin', user.restaurantId);
    }

    const handleNewOrder = (order: any) => {
      const toastId = `toast-order-${order.id || order.orderNumber || Date.now()}`;
      setToasts((prev) => {
        if (prev.some((t) => t.id === toastId)) return prev;
        playNotificationChime('order');
        fetchNotificationCount();
        const newToast: ToastAlert = {
          id: toastId,
          title: `New Order #${order.orderNumber || ''}`,
          message: `Table ${order.table?.tableNumber || 1} placed ₹${(order.totalAmount || 0).toFixed(0)} order`,
          type: 'order',
        };
        setTimeout(() => {
          setToasts((current) => current.filter((t) => t.id !== toastId));
        }, 7000);
        return [newToast, ...prev.slice(0, 2)];
      });
    };

    const handleServiceRequest = (req: any) => {
      const toastId = `toast-service-${req.id || `${req.tableNumber}-${req.requestType}`}-${Math.floor(Date.now() / 4000)}`;
      setToasts((prev) => {
        if (prev.some((t) => t.id === toastId)) return prev;
        playNotificationChime('service');
        fetchNotificationCount();
        const newToast: ToastAlert = {
          id: toastId,
          title: `Table ${req.tableNumber} Service Call`,
          message: req.title || 'Waiter Assistance Requested',
          type: 'service',
        };
        setTimeout(() => {
          setToasts((current) => current.filter((t) => t.id !== toastId));
        }, 8000);
        return [newToast, ...prev.slice(0, 2)];
      });
    };

    const handleNewNotification = () => {
      fetchNotificationCount();
    };

    socket.on('new-order', handleNewOrder);
    socket.on('service-request', handleServiceRequest);
    socket.on('order-status-update', handleNewNotification);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('service-request', handleServiceRequest);
      socket.off('order-status-update', handleNewNotification);
    };
  }, [user]);

  const fetchNotificationCount = async () => {
    try {
      const res = await api.get('/notifications');
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // Fallback silent
    }
  };

  return (
    <>
      <header className="fixed top-0 right-0 left-64 h-16 bg-[#121414]/90 backdrop-blur-xl border-b border-[#4f4539]/20 px-8 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <h2 className="font-serif-heading font-bold text-lg text-[#e3e2e2]">{title}</h2>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Customer Menu Launcher */}
          <Link
            to={`/r/${restaurantSlug}/t/tbl-token-5b674914-e934-4d35-aa7e-828ad95ea0a1/menu`}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1f2020] border border-[#4f4539]/40 hover:border-[#edbf7b]/50 text-xs font-semibold uppercase tracking-wider text-[#d2c4b4] hover:text-[#edbf7b] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            <span>Customer Menu</span>
          </Link>

          {/* Notifications Icon Button */}
          <Link
            to="/admin/notifications"
            className="relative p-2 rounded-xl bg-[#1f2020] border border-[#4f4539]/30 text-[#d2c4b4] hover:text-[#edbf7b] hover:border-[#edbf7b]/40 transition-colors"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#edbf7b] text-[#442b00] font-extrabold text-[9px] flex items-center justify-center animate-bounce shadow-md">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Profile Avatar Button */}
          <Link
            to="/admin/profile"
            className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-xl bg-[#1f2020] border border-[#4f4539]/30 hover:border-[#edbf7b]/40 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#edbf7b] text-[#442b00] font-bold text-xs flex items-center justify-center">
              {user?.name ? user.name[0] : 'A'}
            </div>
            <span className="text-xs font-semibold text-[#e3e2e2] hidden md:block">
              {user?.name?.split(' ')[0] || 'Admin'}
            </span>
          </Link>
        </div>
      </header>

      {/* Real-time Toast Popups in Admin Portal */}
      {toasts.length > 0 && (
        <div className="fixed top-20 right-8 z-50 space-y-2 max-w-sm pointer-events-auto">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-3 animate-fade-in ${
                toast.type === 'service'
                  ? 'bg-amber-950/90 border-amber-500/60 text-amber-200'
                  : 'bg-[#1f2020]/95 border-[#edbf7b]/60 text-[#e3e2e2]'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  toast.type === 'service'
                    ? 'bg-amber-500 text-amber-950'
                    : 'bg-[#edbf7b] text-[#442b00]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {toast.type === 'service' ? 'room_service' : 'restaurant'}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-serif-heading font-bold text-sm text-[#edbf7b]">
                  {toast.title}
                </p>
                <p className="text-[11px] text-[#d2c4b4] mt-0.5">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-[#9b8f80] hover:text-[#e3e2e2]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
