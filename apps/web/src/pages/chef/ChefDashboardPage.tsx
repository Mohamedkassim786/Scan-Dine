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

interface MenuItemAvailability {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  categoryId: string;
  category?: { id: string; name: string };
  dietaryType?: string;
}

export const ChefDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'availability'>('orders');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastNotification, setLastNotification] = useState<string | null>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceCall[]>([]);
  const [filterTable, setFilterTable] = useState<string>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Menu Availability State
  const [menuItems, setMenuItems] = useState<MenuItemAvailability[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMenuLoading, setIsMenuLoading] = useState<boolean>(false);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchMenuItems();
    fetchCategories();

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

    const handleAvailabilityChanged = (data: { menuItemId: string; isAvailable: boolean }) => {
      setMenuItems((prev) =>
        prev.map((m) => (m.id === data.menuItemId ? { ...m, isAvailable: data.isAvailable } : m))
      );
    };

    socket.on('new-order', handleNewOrder);
    socket.on('service-request', handleServiceRequest);
    socket.on('order-status-update', fetchOrders);
    socket.on('menu-availability-changed', handleAvailabilityChanged);

    const interval = setInterval(fetchOrders, 3000);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('service-request', handleServiceRequest);
      socket.off('order-status-update', fetchOrders);
      socket.off('menu-availability-changed', handleAvailabilityChanged);
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

  const fetchMenuItems = async () => {
    setIsMenuLoading(true);
    try {
      const res = await api.get('/menu');
      setMenuItems(res.data);
    } catch (err) {
      console.error('Failed to fetch menu items:', err);
    } finally {
      setIsMenuLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleToggleAvailability = async (item: MenuItemAvailability) => {
    const newStatus = !item.isAvailable;
    setTogglingItemId(item.id);

    // Optimistic UI update
    setMenuItems((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, isAvailable: newStatus } : m))
    );

    try {
      await api.patch(`/menu/${item.id}/availability`, { isAvailable: newStatus });
      const toastMsg = `${item.name} is now ${newStatus ? 'available' : 'unavailable'}.`;
      setLastNotification(toastMsg);
      setTimeout(() => setLastNotification(null), 4000);
    } catch (err) {
      console.error('Failed to toggle availability:', err);
      // Rollback optimistic update
      setMenuItems((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, isAvailable: item.isAvailable } : m))
      );
    } finally {
      setTogglingItemId(null);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders();
      setLastNotification(
        `Order #${orders.find((o) => o.id === orderId)?.orderNumber} updated to ${newStatus.toUpperCase()}`
      );
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

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const availableCount = menuItems.filter((i) => i.isAvailable).length;
  const unavailableCount = menuItems.filter((i) => !i.isAvailable).length;

  return (
    <div className="min-h-screen bg-[#0d0e0f] text-[#e3e2e2] flex flex-col">
      {/* Kitchen Header Bar */}
      <header className="h-16 bg-[#1f2020] border-b border-[#4f4539]/30 px-4 sm:px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#121414] border border-[#edbf7b]/40 flex items-center justify-center text-[#edbf7b]">
            <span className="material-symbols-outlined text-[20px]">skillet</span>
          </div>
          <div>
            <h1 className="font-serif-heading font-bold text-base text-[#edbf7b]">
              Chef Kitchen Portal • Aurelian
            </h1>
            <p className="text-[10px] text-[#d2c4b4]/60">Chef: {user?.name || 'Executive Chef'}</p>
          </div>
        </div>

        {/* Tab Switcher: Orders vs Availability */}
        <div className="flex bg-[#121414] p-1 rounded-xl border border-[#4f4539]/40">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              activeTab === 'orders'
                ? 'bg-[#edbf7b] text-[#442b00] shadow-md'
                : 'text-[#d2c4b4] hover:text-[#e3e2e2]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>Orders KDS ({orders.filter((o) => o.status !== 'served' && o.status !== 'cancelled').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('availability')}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              activeTab === 'availability'
                ? 'bg-[#edbf7b] text-[#442b00] shadow-md'
                : 'text-[#d2c4b4] hover:text-[#e3e2e2]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">toggle_on</span>
            <span>Menu Availability ({unavailableCount} 86'd)</span>
          </button>
        </div>

        {/* Live Notification Banner */}
        {lastNotification && (
          <div className="px-4 py-1.5 rounded-full bg-[#edbf7b] text-[#121414] font-bold text-xs animate-bounce flex items-center gap-2 shadow-xl border border-white/20">
            <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            <span>{lastNotification}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {activeTab === 'orders' && (
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
          )}

          <button
            onClick={() => {
              if (activeTab === 'orders') fetchOrders();
              else fetchMenuItems();
            }}
            className="p-2 rounded-lg bg-[#121414] border border-[#4f4539]/40 text-[#d2c4b4] hover:text-[#edbf7b]"
            title="Refresh Data"
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
      {serviceRequests.length > 0 && activeTab === 'orders' && (
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

      {/* ── TAB 1: ORDERS (KDS KANBAN BOARD) ── */}
      {activeTab === 'orders' && (
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
      )}

      {/* ── TAB 2: MENU AVAILABILITY (KITCHEN 86 / AVAILABILITY CONTROL) ── */}
      {activeTab === 'availability' && (
        <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Action & Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div>
              <h2 className="font-serif-heading text-xl font-bold text-[#e3e2e2]">
                Kitchen Food Availability Control
              </h2>
              <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
                Toggle dish operational status in real-time. Unavailable items are instantly blocked on customer screens.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Available: {availableCount}</span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Unavailable (86'd): {unavailableCount}</span>
              </div>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[240px]">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#9b8f80] text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food item by name or category..."
                className="w-full bg-[#121414] border border-[#4f4539]/40 rounded-xl pl-9 pr-4 py-2 text-xs text-[#e3e2e2] placeholder-[#9b8f80] focus:outline-none focus:border-[#edbf7b]"
              />
            </div>

            <div className="flex overflow-x-auto hide-scrollbar gap-1.5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-[#edbf7b] text-[#442b00]'
                    : 'bg-[#121414] text-[#d2c4b4] border border-[#4f4539]/30'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-colors whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-[#edbf7b] text-[#442b00]'
                      : 'bg-[#121414] text-[#d2c4b4] border border-[#4f4539]/30'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          {isMenuLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-[#edbf7b] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-[#d2c4b4]/60 uppercase tracking-wider">
                Loading Kitchen Dishes...
              </p>
            </div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="py-16 text-center text-[#d2c4b4]/50 italic p-6 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30">
              No dishes found matching your search filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMenuItems.map((item) => {
                const isAvailable = item.isAvailable;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border space-y-3 transition-all shadow-lg flex flex-col justify-between ${
                      isAvailable
                        ? 'bg-[#1f2020] border-[#4f4539]/40 hover:border-[#edbf7b]/40'
                        : 'bg-[#181515] border-rose-500/40 text-rose-100/90'
                    }`}
                  >
                    {/* Top Row: Food Image + Info */}
                    <div className="flex gap-3">
                      <img
                        src={
                          item.imageUrl ||
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80'
                        }
                        alt={item.name}
                        className={`w-16 h-16 rounded-xl object-cover border ${
                          isAvailable ? 'border-[#4f4539]/40' : 'border-rose-500/50 opacity-60 grayscale'
                        }`}
                      />

                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <h3 className="font-serif-heading font-bold text-sm text-[#e3e2e2] leading-tight">
                            {item.name}
                          </h3>
                        </div>

                        <p className="text-[10px] text-[#d2c4b4]/70 font-medium">
                          Category: {item.category?.name || 'General'}
                        </p>

                        <p className="font-serif-heading font-extrabold text-xs text-[#edbf7b]">
                          ₹{item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Operational Availability Controls */}
                    <div className="pt-3 border-t border-[#4f4539]/20 flex items-center justify-between gap-2">
                      {/* Status Badge */}
                      <div
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                          isAvailable
                            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-950/70 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isAvailable ? 'bg-emerald-400' : 'bg-rose-500'
                          }`}
                        />
                        <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
                      </div>

                      {/* Single Tap Toggle Switch */}
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        disabled={togglingItemId === item.id}
                        className={`h-9 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 ${
                          isAvailable
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                            : 'bg-rose-600 hover:bg-rose-500 text-white'
                        }`}
                        title={isAvailable ? 'Click to mark Unavailable (86)' : 'Click to mark Available'}
                      >
                        {togglingItemId === item.id ? (
                          <span className="material-symbols-outlined text-[16px] animate-spin">
                            sync
                          </span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[16px]">
                              {isAvailable ? 'toggle_on' : 'toggle_off'}
                            </span>
                            <span>{isAvailable ? 'ON' : 'OFF'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}
    </div>
  );
};
