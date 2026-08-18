import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useCustomerStore } from '../../store/useCustomerStore';
import { CustomerHeader } from '../../components/customer/CustomerHeader';
import { CustomerBottomNav } from '../../components/customer/CustomerBottomNav';
import { FoodCard } from '../../components/customer/FoodCard';
import { DishDetailModal } from '../../components/customer/DishDetailModal';
import { Category, MenuItem, Order } from '../../types';
import { formatImageUrl } from '../../utils/image';

export const MenuPage: React.FC = () => {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const { restaurant, session, initSessionFromQR } = useCustomerStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [sessionOrders, setSessionOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);

  // Service Request Modal
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [isSendingService, setIsSendingService] = useState(false);

  useEffect(() => {
    if (token && !restaurant) {
      initSessionFromQR(token);
    }
  }, [token, restaurant]);

  useEffect(() => {
    if (restaurant?.id) {
      fetchMenuData();
    }
  }, [restaurant?.id, selectedCategory]);

  useEffect(() => {
    fetchSessionOrders();

    const socket = getSocket();
    const handleUpdate = () => {
      fetchSessionOrders();
    };

    const handleAvailabilityChanged = (data: { menuItemId: string; isAvailable: boolean; menuItem?: MenuItem }) => {
      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === data.menuItemId ? { ...item, isAvailable: data.isAvailable } : item
        )
      );
      if (selectedDish?.id === data.menuItemId) {
        setSelectedDish((prev) => (prev ? { ...prev, isAvailable: data.isAvailable } : null));
      }
    };

    socket.on('order-status-update', handleUpdate);
    socket.on('new-order', handleUpdate);
    socket.on('menu-availability-changed', handleAvailabilityChanged);

    const interval = setInterval(fetchSessionOrders, 4000);

    return () => {
      socket.off('order-status-update', handleUpdate);
      socket.off('new-order', handleUpdate);
      socket.off('menu-availability-changed', handleAvailabilityChanged);
      clearInterval(interval);
    };
  }, [token, session?.token, selectedDish?.id]);

  const fetchMenuData = async () => {
    setIsLoading(true);
    try {
      const catRes = await api.get(`/categories?restaurantId=${restaurant?.id}`);
      setCategories(catRes.data);

      const queryParams = new URLSearchParams();
      queryParams.append('restaurantId', restaurant?.id || '');
      if (selectedCategory !== 'all') {
        queryParams.append('categoryId', selectedCategory);
      }
      const itemsRes = await api.get(`/menu?${queryParams.toString()}`);
      setMenuItems(itemsRes.data);
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessionOrders = async () => {
    const activeToken = token || session?.token;
    if (!activeToken) return;
    try {
      const res = await api.get(`/orders?sessionToken=${activeToken}`);
      setSessionOrders(res.data || []);
    } catch {}
  };

  const handleServiceRequest = async (requestType: string, label: string) => {
    if (!token) return;
    setIsSendingService(true);
    try {
      await api.post('/tables/service-request', {
        qrToken: token,
        requestType,
      });
      setServiceMessage(`${label} sent to staff! Someone will attend to your table shortly.`);
      setTimeout(() => {
        setServiceMessage(null);
        setIsServiceModalOpen(false);
      }, 3000);
    } catch (err) {
      console.error('Service request failed:', err);
    } finally {
      setIsSendingService(false);
    }
  };

  const chefsPick = menuItems.find((i) => i.isChefPick);
  const baseRoute = `/r/${slug}/t/${token}`;
  const latestOrder = sessionOrders[0];

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] pb-28 pt-16">
      <CustomerHeader title="Menu" />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 space-y-5">
        {/* Active Order Banner if customer has active orders */}
        {latestOrder && (
          <Link
            to={`${baseRoute}/orders`}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-[#1f2020] border border-emerald-500/50 shadow-xl flex items-center justify-between gap-3 group hover:border-emerald-400 transition-all block"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/80 flex items-center justify-center text-emerald-400 shrink-0 animate-pulse">
                <span className="material-symbols-outlined text-[20px]">skillet</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#edbf7b]">
                    Order #{latestOrder.orderNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    {latestOrder.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#d2c4b4]/80 mt-0.5">
                  {latestOrder.items.length} {latestOrder.items.length === 1 ? 'dish' : 'dishes'} in kitchen • Total ₹{latestOrder.totalAmount.toFixed(0)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-[#edbf7b] group-hover:translate-x-1 transition-transform">
              <span>View Orders & Bill</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </div>
          </Link>
        )}

        {/* Time-Aware Greeting */}
        <section className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
              Good evening.
            </h2>
            <p className="text-xs sm:text-sm text-[#d2c4b4]/70">
              Discover our seasonal gastronomy and vintage pairings.
            </p>
          </div>

          {/* Table Service Button */}
          <button
            onClick={() => setIsServiceModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#1f2020] border border-[#edbf7b]/40 text-[#edbf7b] hover:bg-[#edbf7b] hover:text-[#442b00] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shrink-0"
          >
            <span className="material-symbols-outlined text-[17px]">room_service</span>
            <span className="hidden sm:inline">Call Concierge</span>
          </button>
        </section>

        {/* Horizontal Scrollable Categories */}
        <section className="flex overflow-x-auto hide-scrollbar gap-2 -mx-4 px-4 sm:mx-0 sm:px-0 py-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              selectedCategory === 'all'
                ? 'bg-[#edbf7b] text-[#442b00] shadow-md scale-102'
                : 'bg-[#1f2020] text-[#d2c4b4] border border-[#4f4539]/30 hover:border-[#edbf7b]/40'
            }`}
          >
            All Selections
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                selectedCategory === cat.id
                  ? 'bg-[#edbf7b] text-[#442b00] shadow-md scale-102'
                  : 'bg-[#1f2020] text-[#d2c4b4] border border-[#4f4539]/30 hover:border-[#edbf7b]/40'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </section>

        {/* Chef's Pick Featured Banner */}
        {selectedCategory === 'all' && chefsPick && (
          <section className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-[#edbf7b]">
              <span className="material-symbols-outlined text-[18px]">star</span>
              <h3 className="font-serif-heading text-lg font-bold text-[#e3e2e2]">Chef's Special Recommendation</h3>
            </div>

            <div
              onClick={() => setSelectedDish(chefsPick)}
              className="relative w-full rounded-2xl overflow-hidden bg-[#1f2020] border border-[#edbf7b]/40 shadow-xl cursor-pointer group"
            >
              <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-[#121414] overflow-hidden">
                <img
                  src={formatImageUrl(chefsPick.imageUrl)}
                  alt={chefsPick.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e: any) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1f2020] via-[#1f2020]/40 to-transparent" />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#edbf7b] text-[#442b00] text-[11px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  Featured Tonight
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-serif-heading text-xl sm:text-2xl font-bold text-[#e3e2e2] group-hover:text-[#edbf7b] transition-colors">
                    {chefsPick.name}
                  </h4>
                  <span className="font-serif-heading text-xl font-bold text-[#edbf7b]">
                    ₹{chefsPick.price.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#d2c4b4]/80 line-clamp-2 leading-relaxed">
                  {chefsPick.description}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Menu Items Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-heading text-lg font-bold text-[#e3e2e2]">
              {selectedCategory === 'all'
                ? 'Full Gastronomy Menu'
                : categories.find((c) => c.id === selectedCategory)?.name}
            </h3>
            <span className="text-xs text-[#d2c4b4]/60">{menuItems.length} Dishes</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-56 rounded-xl bg-[#1f2020] animate-pulse" />
              ))}
            </div>
          ) : menuItems.length === 0 ? (
            <div className="py-12 text-center text-[#d2c4b4]/60">
              <span className="material-symbols-outlined text-[40px] mb-2 text-[#4f4539]">dinner_dining</span>
              <p>No dishes found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {menuItems.map((item) => (
                <FoodCard key={item.id} item={item} onSelect={(dish) => setSelectedDish(dish)} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating Service Concierge Button */}
      <button
        onClick={() => setIsServiceModalOpen(true)}
        className="fixed bottom-20 left-4 z-40 px-3.5 py-2.5 rounded-full bg-[#1f2020] border border-[#edbf7b]/50 text-[#edbf7b] shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform"
        aria-label="Call Waiter"
      >
        <span className="material-symbols-outlined text-[20px]">room_service</span>
        <span className="text-xs font-bold uppercase tracking-wider">Service</span>
      </button>

      {/* Floating AI Assistant Action */}
      <Link
        to={`${baseRoute}/assistant`}
        className="fixed bottom-20 right-4 z-40 w-13 h-13 rounded-full bg-[#edbf7b] text-[#442b00] shadow-[0_4px_20px_rgba(189,147,84,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label="Open Dine AI Assistant"
      >
        <span className="material-symbols-outlined text-[26px]">auto_awesome</span>
      </Link>

      {/* Table Service Assistance Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#1f2020] rounded-3xl border border-[#edbf7b]/40 p-6 space-y-4 shadow-2xl text-center">
            <div className="flex justify-between items-center pb-2 border-b border-[#4f4539]/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#edbf7b]">room_service</span>
                <h3 className="font-serif-heading text-lg font-bold text-[#e3e2e2]">
                  Table Concierge
                </h3>
              </div>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-[#9b8f80] hover:text-[#e3e2e2]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {serviceMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold space-y-2">
                <span className="material-symbols-outlined text-[32px]">check_circle</span>
                <p>{serviceMessage}</p>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-left">
                <p className="text-[#d2c4b4]/70 text-center pb-1">
                  How may we assist you at your table?
                </p>

                {[
                  { key: 'waiter', label: 'Call Server to Table', icon: 'person_raised_hand' },
                  { key: 'water', label: 'Request Water / Ice', icon: 'water_drop' },
                  { key: 'cutlery', label: 'Request Extra Cutlery / Napkins', icon: 'restaurant' },
                  { key: 'bill', label: 'Request Final Printed Bill', icon: 'receipt' },
                ].map((action) => (
                  <button
                    key={action.key}
                    disabled={isSendingService}
                    onClick={() => handleServiceRequest(action.key, action.label)}
                    className="w-full p-3.5 rounded-2xl bg-[#121414] hover:bg-[#343535] border border-[#4f4539]/30 hover:border-[#edbf7b]/40 flex items-center gap-3 transition-colors text-[#e3e2e2] font-semibold"
                  >
                    <span className="material-symbols-outlined text-[#edbf7b] text-[20px]">{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <CustomerBottomNav />
      <DishDetailModal item={selectedDish} onClose={() => setSelectedDish(null)} />
    </div>
  );
};
