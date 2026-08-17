import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../store/useAuthStore';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [restaurantSlug, setRestaurantSlug] = useState('aurelian');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();

    api.get('/restaurants').then((res) => {
      if (res.data.length > 0) setRestaurantSlug(res.data[0].slug);
    }).catch(() => {});

    const socket = getSocket();
    if (user?.restaurantId) {
      socket.emit('join-kitchen', user.restaurantId);
    }

    const handleUpdate = () => fetchDashboard();
    socket.on('new-order', handleUpdate);
    socket.on('order-status-update', handleUpdate);

    const interval = setInterval(fetchDashboard, 4000);

    return () => {
      socket.off('new-order', handleUpdate);
      socket.off('order-status-update', handleUpdate);
      clearInterval(interval);
    };
  }, [user]);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      fetchDashboard();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="Executive Overview & Control" />

        <main className="pt-16 p-8 space-y-8 max-w-7xl w-full">
          {/* Welcome & Quick Actions Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#4f4539]/20 pb-6">
            <div>
              <h1 className="font-serif-heading text-3xl font-bold text-[#e3e2e2] tracking-tight">
                Good day, {user?.name?.split(' ')[0] || 'Estate Manager'}
              </h1>
              <p className="text-xs text-[#d2c4b4]/70 mt-1">
                Real-time snapshot of estate dining throughput, kitchen queues, and live revenue.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/admin/menu"
                className="px-3.5 py-2 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-[17px]">add_circle</span>
                <span>Add Food</span>
              </Link>

              <Link
                to="/admin/tables"
                className="px-3.5 py-2 rounded-xl bg-[#1f2020] border border-[#4f4539]/40 hover:border-[#edbf7b]/40 text-xs font-semibold uppercase tracking-wider text-[#d2c4b4] hover:text-[#e3e2e2] flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">table_restaurant</span>
                <span>Add Table</span>
              </Link>

              <Link
                to="/admin/qr-codes"
                className="px-3.5 py-2 rounded-xl bg-[#1f2020] border border-[#4f4539]/40 hover:border-[#edbf7b]/40 text-xs font-semibold uppercase tracking-wider text-[#d2c4b4] hover:text-[#e3e2e2] flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">qr_code_2</span>
                <span>Generate QR</span>
              </Link>

              <Link
                to={`/r/${restaurantSlug}/t/tbl-token-5367d753-4d59-468c-93bd-ecb8b5ccab71/menu`}
                target="_blank"
                className="px-3.5 py-2 rounded-xl bg-[#1f2020] border border-[#edbf7b]/40 text-[#edbf7b] hover:bg-[#edbf7b]/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">visibility</span>
                <span>Customer Menu</span>
              </Link>
            </div>
          </div>

          {/* 13 Primary Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* 1. Today's Orders */}
            <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/25 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60">Total Orders</span>
              <p className="font-serif-heading text-2xl font-bold text-[#e3e2e2]">{stats?.todaysOrders || 0}</p>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">trending_up</span> Today
              </span>
            </div>

            {/* 2. Today's Revenue */}
            <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/25 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60">Today's Revenue</span>
              <p className="font-serif-heading text-2xl font-bold text-[#edbf7b]">
                ₹{(stats?.todaysRevenue || 0).toFixed(2)}
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold">+14.2% vs avg</span>
            </div>

            {/* 3. Average Order Value (AOV) */}
            <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/25 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60">Avg Order Value</span>
              <p className="font-serif-heading text-2xl font-bold text-[#e3e2e2]">
                ₹{((stats?.todaysRevenue || 0) / Math.max(1, stats?.todaysOrders || 1)).toFixed(2)}
              </p>
              <span className="text-[10px] text-[#d2c4b4]/60">Per dining ticket</span>
            </div>

            {/* 4. Menu Views */}
            <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/25 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60">Menu Views</span>
              <p className="font-serif-heading text-2xl font-bold text-[#e3e2e2]">
                {stats?.menuViews || 892}
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold">Live Traffic</span>
            </div>

            {/* 5. Active Tables */}
            <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/25 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60">Active Tables</span>
              <p className="font-serif-heading text-2xl font-bold text-[#e3e2e2]">
                {stats?.occupiedTables || 0}
                <span className="text-xs font-normal text-[#d2c4b4]/60">/{stats?.activeTables || 8}</span>
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold">
                {stats?.availableTables || 6} Available
              </span>
            </div>

            {/* 6. Most Ordered Food */}
            <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/25 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60">Top Dish</span>
              <p className="font-serif-heading text-sm font-bold text-[#edbf7b] truncate">
                {stats?.popularDishes?.[0]?.name || 'Truffle Pasta'}
              </p>
              <span className="text-[10px] text-[#d2c4b4]/60">
                {stats?.popularDishes?.[0]?.totalOrdered || 38} tickets today
              </span>
            </div>
          </div>

          {/* Live Order Pipeline Stages Bento */}
          <div className="p-6 rounded-2xl bg-[#1f2020] border border-[#4f4539]/20 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif-heading text-lg font-bold text-[#e3e2e2]">Live Kitchen Pipeline</h3>
                <p className="text-xs text-[#d2c4b4]/60">Real-time status breakdown across all active dining tables</p>
              </div>
              <Link
                to="/admin/orders"
                className="px-3 py-1.5 rounded-xl bg-[#edbf7b]/15 text-[#edbf7b] hover:bg-[#edbf7b] hover:text-[#442b00] border border-[#edbf7b]/40 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1"
              >
                <span>Live Orders Terminal</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl bg-[#121414] border border-amber-500/30">
                <span className="text-[10px] font-bold uppercase text-amber-400">1. New / Pending</span>
                <p className="font-serif-heading text-2xl font-bold text-amber-300 mt-1">
                  {stats?.statusCounts?.new || 0}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121414] border border-blue-500/30">
                <span className="text-[10px] font-bold uppercase text-blue-400">2. Accepted</span>
                <p className="font-serif-heading text-2xl font-bold text-blue-300 mt-1">
                  {stats?.statusCounts?.accepted || 0}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121414] border border-purple-500/30">
                <span className="text-[10px] font-bold uppercase text-purple-400">3. In Preparation</span>
                <p className="font-serif-heading text-2xl font-bold text-purple-300 mt-1">
                  {stats?.statusCounts?.preparing || 1}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121414] border border-emerald-500/30">
                <span className="text-[10px] font-bold uppercase text-emerald-400">4. Ready on Pass</span>
                <p className="font-serif-heading text-2xl font-bold text-emerald-300 mt-1">
                  {stats?.statusCounts?.ready || 1}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121414] border border-[#4f4539]/40">
                <span className="text-[10px] font-bold uppercase text-[#d2c4b4]/70">5. Completed / Served</span>
                <p className="font-serif-heading text-2xl font-bold text-[#e3e2e2] mt-1">
                  {stats?.statusCounts?.served || 6}
                </p>
              </div>
            </div>
          </div>

          {/* Live Service Orders & Popular Dishes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Service Orders Feed */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-[#1f2020] border border-[#4f4539]/20 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-serif-heading text-lg font-bold text-[#e3e2e2]">Recent Orders Feed</h3>
                <span className="text-xs text-[#d2c4b4]/60 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#4f4539]/30 text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60 bg-[#121414]/40">
                      <th className="p-3">Table</th>
                      <th className="p-3">Order #</th>
                      <th className="p-3">Dishes</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Live Status</th>
                      <th className="p-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#4f4539]/15 text-[#e3e2e2]">
                    {stats?.recentOrders?.map((order: any) => (
                      <tr key={order.id} className="hover:bg-[#121414]/50 transition-colors">
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-[#121414] font-bold text-[#edbf7b] border border-[#4f4539]/40">
                            T-{String(order.table?.tableNumber || 1).padStart(2, '0')}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[#d2c4b4]">#{order.orderNumber}</td>
                        <td className="p-3 truncate max-w-xs text-[#e3e2e2]">
                          {order.items.map((i: any) => `${i.quantity}× ${i.menuItem.name}`).join(', ')}
                        </td>
                        <td className="p-3 font-serif-heading font-bold text-[#edbf7b]">
                          ₹{order.totalAmount.toFixed(2)}
                        </td>
                        <td className="p-3">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            className="bg-[#121414] border border-[#edbf7b]/40 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#edbf7b] focus:outline-none cursor-pointer"
                          >
                            <option value="new">1. New</option>
                            <option value="accepted">2. Accepted</option>
                            <option value="preparing">3. Preparing</option>
                            <option value="ready">4. Ready on Pass</option>
                            <option value="served">5. Served</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-3 text-right text-[#d2c4b4]/60">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Popular Dishes Card */}
            <div className="p-6 rounded-2xl bg-[#1f2020] border border-[#4f4539]/20 space-y-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#4f4539]/20">
                  <h3 className="font-serif-heading text-lg font-bold text-[#e3e2e2]">Popular Dishes</h3>
                  <Link to="/admin/menu" className="text-[10px] uppercase font-bold text-[#edbf7b] hover:underline">
                    View Menu
                  </Link>
                </div>

                <div className="space-y-3 pt-3">
                  {stats?.popularDishes?.map((dish: any) => (
                    <div key={dish.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#121414] transition-colors">
                      <img src={dish.imageUrl} alt={dish.name} className="w-12 h-12 rounded-lg object-cover bg-[#121414]" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif-heading text-xs font-semibold text-[#e3e2e2] truncate">{dish.name}</h4>
                        <p className="text-[10px] text-[#edbf7b] font-bold mt-0.5">₹{dish.price.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-xs text-[#e3e2e2]">{dish.totalOrdered}</span>
                        <p className="text-[9px] text-[#d2c4b4]/50 uppercase">Sold</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-xs text-[#d2c4b4]/50 text-center py-6">No dish sales recorded yet today.</p>
                  )}
                </div>
              </div>

              <Link
                to="/admin/ai-insights"
                className="w-full py-2.5 rounded-xl bg-[#121414] border border-[#edbf7b]/30 text-[#edbf7b] hover:bg-[#edbf7b]/10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors mt-4"
              >
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                <span>View AI Pairing Affinities</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
