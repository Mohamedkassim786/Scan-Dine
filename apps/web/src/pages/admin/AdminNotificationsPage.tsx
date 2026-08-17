import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../store/useAuthStore';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';

export const AdminNotificationsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchNotifications();

    const socket = getSocket();
    if (user?.restaurantId) {
      socket.emit('join-kitchen', user.restaurantId);
    }

    const handleUpdate = () => fetchNotifications();
    socket.on('new-order', handleUpdate);
    socket.on('order-status-update', handleUpdate);

    return () => {
      socket.off('new-order', handleUpdate);
      socket.off('order-status-update', handleUpdate);
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read', {});
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try {
      await api.delete('/notifications/clear');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return { icon: 'receipt_long', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' };
      case 'payment_pending':
        return { icon: 'payments', color: 'text-amber-300 bg-amber-950/60 border-amber-500/30' };
      case 'payment_completed':
        return { icon: 'verified', color: 'text-blue-400 bg-blue-950/60 border-blue-500/30' };
      case 'failed_payment':
        return { icon: 'error', color: 'text-rose-400 bg-rose-950/60 border-rose-500/30' };
      case 'table_activity':
        return { icon: 'table_restaurant', color: 'text-purple-400 bg-purple-950/60 border-purple-500/30' };
      default:
        return { icon: 'info', color: 'text-[#edbf7b] bg-[#edbf7b]/20 border-[#edbf7b]/30' };
    }
  };

  const filtered = filterType === 'all'
    ? notifications
    : notifications.filter((n) => n.type === filterType);

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="Admin Notifications & Alerts" />

        <main className="pt-16 p-8 space-y-6 max-w-5xl w-full">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4f4539]/20 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
                  Live Notifications & Alerts
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#edbf7b] text-[#442b00] font-bold text-xs">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
                Real-time operational alerts for kitchen tickets, payment states, and table service
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                className="px-3.5 py-2 rounded-xl bg-[#1f2020] border border-[#4f4539]/40 hover:border-[#edbf7b]/40 text-xs font-semibold text-[#d2c4b4] hover:text-[#edbf7b] transition-colors"
              >
                Mark All Read
              </button>
              <button
                onClick={handleClearAll}
                className="px-3.5 py-2 rounded-xl bg-[#1f2020] border border-rose-500/30 text-rose-300 hover:bg-rose-950/40 text-xs font-semibold transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Type Filter Tabs */}
          <div className="flex overflow-x-auto hide-scrollbar gap-1.5 py-1">
            {[
              { key: 'all', label: 'All Notifications' },
              { key: 'new_order', label: 'Orders' },
              { key: 'payment_pending', label: 'Cash Pending' },
              { key: 'table_activity', label: 'Tables' },
              { key: 'system_alert', label: 'System' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterType(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                  filterType === tab.key
                    ? 'bg-[#edbf7b] text-[#442b00]'
                    : 'bg-[#1f2020] text-[#d2c4b4] border border-[#4f4539]/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification Items List */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="p-16 rounded-2xl bg-[#1f2020] border border-[#4f4539]/20 text-center space-y-2">
                <span className="material-symbols-outlined text-[44px] text-[#4f4539]">notifications_off</span>
                <p className="text-xs text-[#d2c4b4]/60">No notifications found.</p>
              </div>
            ) : (
              filtered.map((n) => {
                const style = getTypeIcon(n.type);
                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                      n.isRead
                        ? 'bg-[#161818] border-[#4f4539]/20 opacity-80'
                        : 'bg-[#1f2020] border-[#edbf7b]/40 shadow-lg'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${style.color}`}>
                        <span className="material-symbols-outlined text-[20px]">{style.icon}</span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif-heading font-bold text-sm text-[#e3e2e2]">
                            {n.title}
                          </h4>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#edbf7b] animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-[#d2c4b4] leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-[#d2c4b4]/50 pt-1 font-mono">
                          {new Date(n.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>

                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#121414] hover:bg-[#343535] text-[10px] font-semibold text-[#edbf7b] border border-[#edbf7b]/30 shrink-0"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
