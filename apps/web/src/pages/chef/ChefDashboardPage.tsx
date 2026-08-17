import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../store/useAuthStore';
import { playNotificationChime } from '../../utils/audio';
import { Order } from '../../types';

interface ServiceCall {
  id?: string;
  tableNumber: number;
  requestType?: string;
  title: string;
  message: string;
  createdAt: string;
}

export const ChefDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastNotification, setLastNotification] = useState<string | null>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceCall[]>([]);
  const [filterTable, setFilterTable] = useState<string>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();

    const socket = getSocket();
    if (user?.restaurantId) {
      socket.emit('join-kitchen', user.restaurantId);
    }

    const handleNewOrder = (newOrder: Order) => {
      console.log('⚡ New Kitchen Order Received:', newOrder);
      playNotificationChime('order');
      setLastNotification(`New Order #${newOrder.orderNumber} for Table ${newOrder.table?.tableNumber || 1}!`);
      setTimeout(() => setLastNotification(null), 7000);
      fetchOrders();
    };

    const handleServiceRequest = (req: ServiceCall) => {
      console.log('🛎️ Table Service Request Received:', req);
      playNotificationChime('service');
      setServiceRequests((prev) => [req, ...prev.filter((p) => p.tableNumber !== req.tableNumber)]);
      setLastNotification(`🛎️ Table ${req.tableNumber}: ${req.title}!`);
      setTimeout(() => setLastNotification(null), 8000);
    };

    socket.on('new-order', handleNewOrder);
    socket.on('service-request', handleServiceRequest);
    socket.on('order-status-update', fetchOrders);

    const interval = setInterval(fetchOrders, 3000);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('service-request', handleServiceRequest);
      socket.off('order-status-update', fetchOrders);
      clearInterval(interval);
    };
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders();
      setLastNotification(`Order #${orders.find((o) => o.id === orderId)?.orderNumber} updated to ${newStatus.toUpperCase()}`);
      setTimeout(() => setLastNotification(null), 4000);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const dismissServiceRequest = (tableNum: number) => {
    setServiceRequests((prev) => prev.filter((s) => s.tableNumber !== tableNum));
  };

  const columns = [
    {
      key: 'new',
      title: '1. New Orders',
      color: 'border-amber-500/60 bg-amber-950/20 text-amber-300',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      next: 'accepted',
      nextLabel: 'Accept Ticket',
      icon: 'receipt_long',
    },
    {
      key: 'accepted',
      title: '2. Accepted',
      color: 'border-blue-500/60 bg-blue-950/20 text-blue-300',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      next: 'preparing',
      nextLabel: 'Start Cooking',
      icon: 'check_circle',
    },
    {
      key: 'preparing',
      title: '3. In Preparation',
      color: 'border-purple-500/60 bg-purple-950/20 text-purple-300',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      next: 'ready',
      nextLabel: 'Mark Ready on Pass',
      icon: 'skillet',
    },
    {
      key: 'ready',
      title: '4. Ready on Pass',
      color: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      next: 'served',
      nextLabel: 'Mark Served to Table',
      icon: 'room_service',
    },
  ];

  const filteredOrders =
    filterTable === 'all'
      ? orders
      : orders.filter((o) => String(o.table?.tableNumber) === filterTable);

  return (
    <div className="min-h-screen bg-[#0d0e0f] text-[#e3e2e2] flex flex-col">
      {/* Kitchen Header Bar */}
      <header className="h-16 bg-[#1f2020] border-b border-[#4f4539]/30 px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#121414] border border-[#edbf7b]/40 flex items-center justify-center text-[#edbf7b]">
            <span className="material-symbols-outlined text-[20px]">skillet</span>
          </div>
          <div>
            <h1 className="font-serif-heading font-bold text-base text-[#edbf7b]">
              Kitchen Display (KDS) • Aurelian
            </h1>
            <p className="text-[10px] text-[#d2c4b4]/60">Chef: {user?.name || 'Executive Chef'}</p>
          </div>
        </div>

        {/* Live Notification Banner with Sound Chime Trigger */}
        {lastNotification && (
          <div className="px-4 py-1.5 rounded-full bg-[#edbf7b] text-[#121414] font-bold text-xs animate-bounce flex items-center gap-2 shadow-xl border border-white/20">
            <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            <span>{lastNotification}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Table Filter */}
          <select
            value={filterTable}
            onChange={(e) => setFilterTable(e.target.value)}
            className="bg-[#121414] border border-[#4f4539]/40 rounded-lg px-2.5 py-1.5 text-xs text-[#d2c4b4] focus:outline-none focus:border-[#edbf7b]"
          >
            <option value="all">All Tables</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((t) => (
              <option key={t} value={String(t)}>
                Table {t}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              playNotificationChime('order');
              fetchOrders();
            }}
            className="p-2 rounded-lg bg-[#121414] border border-[#4f4539]/40 text-[#d2c4b4] hover:text-[#edbf7b]"
            title="Refresh Live Orders & Test Chime"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/chef/login');
            }}
            className="px-3 py-1.5 rounded-lg bg-[#121414] border border-rose-500/30 text-rose-300 hover:bg-rose-950/40 text-xs font-semibold uppercase tracking-wider"
          >
            Exit Terminal
          </button>
        </div>
      </header>

      {/* Active Table Service Calls Strip */}
      {serviceRequests.length > 0 && (
        <div className="bg-amber-950/90 border-b border-amber-500/50 px-6 py-2 flex flex-wrap items-center gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-400">
            <span className="material-symbols-outlined text-[18px] animate-pulse">room_service</span>
            <span>Active Table Calls:</span>
          </div>

          <div className="flex flex-wrap gap-2 flex-1">
            {serviceRequests.map((req) => (
              <div
                key={req.tableNumber}
                className="px-3 py-1 rounded-xl bg-[#121414] border border-amber-500/40 flex items-center gap-2 text-xs font-semibold shadow-md"
              >
                <span className="px-2 py-0.5 rounded bg-[#edbf7b] text-[#442b00] font-bold text-[10px] uppercase">
                  Table {req.tableNumber}
                </span>
                <span className="text-[#e3e2e2]">{req.title}</span>
                <button
                  onClick={() => dismissServiceRequest(req.tableNumber)}
                  className="ml-1 text-[#9b8f80] hover:text-[#e3e2e2]"
                  title="Dismiss call"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Kanban Board Area */}
      <main className="flex-1 p-4 sm:p-6 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-w-[1050px] h-[calc(100vh-120px)]">
          {columns.map((col) => {
            const colOrders = filteredOrders.filter((o) => o.status === col.key);

            return (
              <div
                key={col.key}
                className="flex flex-col bg-[#161818] rounded-2xl border border-[#4f4539]/30 overflow-hidden shadow-xl"
              >
                {/* Column Header */}
                <div className={`p-3.5 border-b flex items-center justify-between ${col.color}`}>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">{col.icon}</span>
                    <span className="font-bold text-xs uppercase tracking-wider">{col.title}</span>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-[#121414]/80 font-bold text-xs flex items-center justify-center">
                    {colOrders.length}
                  </span>
                </div>

                {/* Orders Column List */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3 hide-scrollbar">
                  {colOrders.length === 0 ? (
                    <div className="py-16 text-center text-[#d2c4b4]/30 text-xs space-y-1">
                      <span className="material-symbols-outlined text-[28px] opacity-40">inventory_2</span>
                      <p>No active tickets</p>
                    </div>
                  ) : (
                    colOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 rounded-xl bg-[#1f2020] border border-[#4f4539]/40 space-y-3 shadow-lg hover:border-[#edbf7b]/60 transition-all"
                      >
                        {/* Card Header: Table + Order No + Elapsed Time */}
                        <div className="flex justify-between items-start pb-2 border-b border-[#4f4539]/20">
                          <div>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#edbf7b] text-[#442b00] font-bold text-xs uppercase shadow-sm">
                              Table {order.table?.tableNumber || 1}
                            </span>
                            <p className="font-mono text-[11px] text-[#d2c4b4]/70 mt-1">
                              #{order.orderNumber}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-[#d2c4b4]/60 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">schedule</span>
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="font-bold text-xs text-[#edbf7b] mt-0.5 block">
                              ₹{order.totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="text-xs space-y-0.5">
                              <div className="flex justify-between font-semibold text-[#e3e2e2]">
                                <span>
                                  <span className="text-[#edbf7b] font-bold text-sm mr-1">{item.quantity}×</span>{' '}
                                  {item.menuItem.name}
                                </span>
                              </div>
                              {item.specialInstructions && (
                                <p className="text-[10px] text-amber-300/90 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30 italic">
                                  Note: {item.specialInstructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Order Special Notes */}
                        {order.specialInstructions && (
                          <div className="p-2 rounded-lg bg-[#121414] border border-[#4f4539]/30 text-[11px] text-[#d2c4b4] italic">
                            "{order.specialInstructions}"
                          </div>
                        )}

                        {/* Status Switcher Controls */}
                        <div className="pt-2 border-t border-[#4f4539]/20 space-y-2">
                          {/* Quick Forward Button */}
                          <button
                            onClick={() => updateStatus(order.id, col.next)}
                            disabled={updatingOrderId === order.id}
                            className="w-full h-9 rounded-lg bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 disabled:opacity-50"
                          >
                            {updatingOrderId === order.id ? (
                              <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                            ) : (
                              <>
                                <span>{col.nextLabel}</span>
                                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                              </>
                            )}
                          </button>

                          {/* Direct Status Selector Dropdown */}
                          <div className="flex items-center justify-between gap-2 text-[10px]">
                            <span className="text-[#d2c4b4]/50 uppercase font-semibold">Change to:</span>
                            <select
                              value={order.status}
                              onChange={(e) => updateStatus(order.id, e.target.value)}
                              className="bg-[#121414] border border-[#4f4539]/40 rounded px-2 py-1 text-[10px] text-[#edbf7b] focus:outline-none"
                            >
                              <option value="new">1. New</option>
                              <option value="accepted">2. Accepted</option>
                              <option value="preparing">3. Preparing</option>
                              <option value="ready">4. Ready on Pass</option>
                              <option value="served">5. Served</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
