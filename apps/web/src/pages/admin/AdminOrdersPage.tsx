import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../store/useAuthStore';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { DigitalReceipt } from '../../components/common/DigitalReceipt';
import { Order } from '../../types';

export const AdminOrdersPage: React.FC = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();

    const socket = getSocket();
    if (user?.restaurantId) {
      socket.emit('join-kitchen', user.restaurantId);
    }

    const handleUpdate = () => {
      fetchOrders();
    };

    socket.on('new-order', handleUpdate);
    socket.on('order-status-update', handleUpdate);

    const interval = setInterval(fetchOrders, 3000);

    return () => {
      socket.off('new-order', handleUpdate);
      socket.off('order-status-update', handleUpdate);
      clearInterval(interval);
    };
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders();
    } catch (err) {
      console.error('Failed to update order status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'accepted':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'preparing':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'ready':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'served':
        return 'bg-neutral-500/20 text-neutral-300 border-neutral-500/40';
      case 'cancelled':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-neutral-500/20 text-neutral-300 border-neutral-500/40';
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesTable = selectedTable === 'all' || String(order.table?.tableNumber) === selectedTable;
    const matchesSearch =
      !searchQuery.trim() ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((i) => i.menuItem.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesTable && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="Live Orders Control" />

        <main className="pt-16 p-8 space-y-6 max-w-7xl w-full">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4f4539]/20 pb-4">
            <div>
              <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
                Live Orders Management
              </h1>
              <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
                Real-time kitchen orders, dining table statuses, and live status dispatch
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Switcher */}
              <div className="flex items-center bg-[#1f2020] p-1 rounded-xl border border-[#4f4539]/30 text-xs">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                    viewMode === 'list' ? 'bg-[#edbf7b] text-[#442b00]' : 'text-[#d2c4b4] hover:text-[#e3e2e2]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
                  <span>List View</span>
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                    viewMode === 'kanban' ? 'bg-[#edbf7b] text-[#442b00]' : 'text-[#d2c4b4] hover:text-[#e3e2e2]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">view_kanban</span>
                  <span>Board View</span>
                </button>
              </div>

              <button
                onClick={fetchOrders}
                className="px-3.5 py-2 rounded-xl bg-[#1f2020] border border-[#4f4539]/40 hover:border-[#edbf7b]/50 text-xs font-semibold text-[#d2c4b4] hover:text-[#edbf7b] flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Sync</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Status Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar gap-1.5">
              {[
                { key: 'all', label: 'All Orders' },
                { key: 'new', label: 'New' },
                { key: 'accepted', label: 'Accepted' },
                { key: 'preparing', label: 'Preparing' },
                { key: 'ready', label: 'Ready on Pass' },
                { key: 'served', label: 'Served' },
                { key: 'cancelled', label: 'Cancelled' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedStatus(tab.key)}
                  className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider text-[11px] transition-colors whitespace-nowrap ${
                    selectedStatus === tab.key
                      ? 'bg-[#edbf7b] text-[#442b00] shadow-sm'
                      : 'bg-[#121414] text-[#d2c4b4] border border-[#4f4539]/30 hover:border-[#edbf7b]/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Table & Search */}
            <div className="flex items-center gap-2.5 flex-1 sm:flex-initial">
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="bg-[#121414] border border-[#4f4539]/40 rounded-xl px-3 py-2 text-xs text-[#d2c4b4] focus:outline-none focus:border-[#edbf7b]"
              >
                <option value="all">All Tables (1-8)</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((t) => (
                  <option key={t} value={String(t)}>
                    Table {t}
                  </option>
                ))}
              </select>

              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order # or dish..."
                  className="w-48 sm:w-60 bg-[#121414] border border-[#4f4539]/40 rounded-xl pl-8 pr-3 py-2 text-xs text-[#e3e2e2] placeholder-[#d2c4b4]/40 focus:outline-none focus:border-[#edbf7b]"
                />
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[#d2c4b4]/50 text-[16px]">
                  search
                </span>
              </div>
            </div>
          </div>

          {/* Orders Content */}
          {isLoading ? (
            <div className="py-20 text-center text-[#d2c4b4]/60 space-y-2">
              <div className="w-10 h-10 border-2 border-[#edbf7b] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold uppercase tracking-wider">Loading Live Orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-16 rounded-2xl bg-[#1f2020] border border-[#4f4539]/20 text-center space-y-3">
              <span className="material-symbols-outlined text-[44px] text-[#4f4539]">receipt_long</span>
              <div className="space-y-1">
                <h3 className="font-serif-heading text-lg font-bold text-[#e3e2e2]">No Orders Found</h3>
                <p className="text-xs text-[#d2c4b4]/60">
                  {selectedStatus !== 'all' || selectedTable !== 'all' || searchQuery
                    ? 'No orders match your selected filters.'
                    : 'There are currently no active orders.'}
                </p>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            /* Table / List View */
            <div className="bg-[#1f2020] rounded-2xl border border-[#4f4539]/20 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#4f4539]/30 text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60 bg-[#121414]/40">
                      <th className="p-4">Table</th>
                      <th className="p-4">Order #</th>
                      <th className="p-4">Dishes & Quantity</th>
                      <th className="p-4">Special Notes</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Time</th>
                      <th className="p-4">Live Status</th>
                      <th className="p-4 text-right">Bill Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#4f4539]/15 text-[#e3e2e2]">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#121414]/50 transition-colors">
                        <td className="p-4 font-bold text-sm">
                          <span className="px-2.5 py-1 rounded-lg bg-[#121414] border border-[#edbf7b]/40 text-[#edbf7b]">
                            Table {order.table?.tableNumber || 1}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-[#d2c4b4]">
                          #{order.orderNumber}
                        </td>
                        <td className="p-4 max-w-xs">
                          <div className="space-y-1">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between gap-2 text-xs">
                                <span className="text-[#e3e2e2]">
                                  <strong className="text-[#edbf7b]">{item.quantity}×</strong> {item.menuItem.name}
                                </span>
                                <span className="text-[#d2c4b4]/70">
                                  ₹{(item.priceAtOrder * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-[11px] text-[#d2c4b4]/70 italic max-w-xs">
                          {order.specialInstructions || '—'}
                        </td>
                        <td className="p-4 font-serif-heading font-bold text-sm text-[#edbf7b] whitespace-nowrap">
                          ₹{order.totalAmount.toFixed(2)}
                        </td>
                        <td className="p-4 text-[11px] text-[#d2c4b4]/60 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4">
                          {/* Interactive Status Selector Dropdown */}
                          <select
                            value={order.status}
                            disabled={updatingOrderId === order.id}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border focus:outline-none cursor-pointer ${getStatusBadge(
                              order.status
                            )}`}
                          >
                            <option value="new" className="bg-[#121414] text-[#e3e2e2]">1. New</option>
                            <option value="accepted" className="bg-[#121414] text-[#e3e2e2]">2. Accepted</option>
                            <option value="preparing" className="bg-[#121414] text-[#e3e2e2]">3. Preparing</option>
                            <option value="ready" className="bg-[#121414] text-[#e3e2e2]">4. Ready on Pass</option>
                            <option value="served" className="bg-[#121414] text-[#e3e2e2]">5. Served</option>
                            <option value="cancelled" className="bg-[#121414] text-rose-300">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setActiveReceiptOrder(order)}
                            className="px-3 py-1.5 rounded-xl bg-[#121414] border border-[#edbf7b]/40 text-[#edbf7b] hover:bg-[#edbf7b] hover:text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md ml-auto"
                            title="View & Print Bill"
                          >
                            <span className="material-symbols-outlined text-[16px]">print</span>
                            <span>Print Bill</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Kanban Board View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: 'new', label: '1. New Orders', color: 'border-amber-500/60' },
                { key: 'accepted', label: '2. Accepted', color: 'border-blue-500/60' },
                { key: 'preparing', label: '3. In Kitchen', color: 'border-purple-500/60' },
                { key: 'ready', label: '4. Ready on Pass', color: 'border-emerald-500/60' },
              ].map((column) => {
                const colOrders = filteredOrders.filter((o) => o.status === column.key);
                return (
                  <div
                    key={column.key}
                    className="flex flex-col bg-[#161818] rounded-2xl border border-[#4f4539]/30 overflow-hidden shadow-lg"
                  >
                    <div className={`p-3 border-b flex justify-between items-center ${column.color}`}>
                      <span className="font-bold text-xs uppercase tracking-wider text-[#e3e2e2]">
                        {column.label}
                      </span>
                      <span className="w-5 h-5 rounded-full bg-[#121414] text-[10px] font-bold flex items-center justify-center text-[#edbf7b]">
                        {colOrders.length}
                      </span>
                    </div>

                    <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[70vh] hide-scrollbar">
                      {colOrders.length === 0 ? (
                        <p className="text-center text-[11px] text-[#d2c4b4]/30 py-8">No tickets</p>
                      ) : (
                        colOrders.map((order) => (
                          <div
                            key={order.id}
                            className="p-3.5 rounded-xl bg-[#1f2020] border border-[#4f4539]/30 space-y-2.5 shadow-md"
                          >
                            <div className="flex justify-between items-start">
                              <span className="px-2 py-0.5 rounded bg-[#edbf7b] text-[#442b00] font-bold text-[10px] uppercase">
                                Table {order.table?.tableNumber || 1}
                              </span>
                              <span className="font-serif-heading font-bold text-xs text-[#edbf7b]">
                                ₹{order.totalAmount.toFixed(2)}
                              </span>
                            </div>

                            <div className="space-y-1 text-xs text-[#e3e2e2]">
                              {order.items.map((i) => (
                                <p key={i.id} className="truncate">
                                  <strong>{i.quantity}×</strong> {i.menuItem.name}
                                </p>
                              ))}
                            </div>

                            <div className="pt-2 border-t border-[#4f4539]/20 flex items-center justify-between text-[10px]">
                              <button
                                onClick={() => setActiveReceiptOrder(order)}
                                className="text-[#edbf7b] hover:underline flex items-center gap-1 font-semibold"
                              >
                                <span className="material-symbols-outlined text-[13px]">print</span>
                                <span>Bill</span>
                              </button>

                              <select
                                value={order.status}
                                onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                className="bg-[#121414] border border-[#4f4539]/40 rounded px-2 py-1 text-[#edbf7b] focus:outline-none"
                              >
                                <option value="new">New</option>
                                <option value="accepted">Accept</option>
                                <option value="preparing">Cook</option>
                                <option value="ready">Ready</option>
                                <option value="served">Served</option>
                                <option value="cancelled">Cancel</option>
                              </select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Admin Printable Bill Modal */}
      {activeReceiptOrder && (
        <DigitalReceipt
          order={activeReceiptOrder as any}
          onClose={() => setActiveReceiptOrder(null)}
          isAdmin={true}
        />
      )}
    </div>
  );
};
