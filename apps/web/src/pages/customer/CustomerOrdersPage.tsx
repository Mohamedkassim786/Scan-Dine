import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useCustomerStore } from '../../store/useCustomerStore';
import { CustomerHeader } from '../../components/customer/CustomerHeader';
import { CustomerBottomNav } from '../../components/customer/CustomerBottomNav';
import { DigitalReceipt } from '../../components/common/DigitalReceipt';
import { Order } from '../../types';

export const CustomerOrdersPage: React.FC = () => {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const { session, table } = useCustomerStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<any | null>(null);
  const [isLoadingConsolidated, setIsLoadingConsolidated] = useState(false);

  const baseRoute = `/r/${slug}/t/${token}`;

  useEffect(() => {
    fetchSessionOrders();

    const socket = getSocket();
    const handleUpdate = () => {
      fetchSessionOrders();
    };

    socket.on('order-status-update', handleUpdate);
    socket.on('new-order', handleUpdate);

    const interval = setInterval(fetchSessionOrders, 3000);

    return () => {
      socket.off('order-status-update', handleUpdate);
      socket.off('new-order', handleUpdate);
      clearInterval(interval);
    };
  }, [token, session?.token]);

  const fetchSessionOrders = async () => {
    try {
      const storedToken = token || session?.token;
      if (!storedToken) return;

      const res = await api.get(`/orders?sessionToken=${storedToken}`);
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch session orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenConsolidatedBill = async () => {
    const storedToken = token || session?.token;
    if (!storedToken) return;
    setIsLoadingConsolidated(true);
    try {
      const res = await api.get(`/orders/session-bill/${storedToken}`);
      setActiveReceiptOrder(res.data);
    } catch (err) {
      console.error('Failed to fetch consolidated bill:', err);
    } finally {
      setIsLoadingConsolidated(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return { text: 'Received by Kitchen', color: 'bg-amber-950/80 text-amber-300 border-amber-500/40', icon: 'receipt_long' };
      case 'accepted': return { text: 'Accepted by Chef', color: 'bg-blue-950/80 text-blue-300 border-blue-500/40', icon: 'check_circle' };
      case 'preparing': return { text: 'Cooking & Plating', color: 'bg-purple-950/80 text-purple-300 border-purple-500/40', icon: 'skillet' };
      case 'ready': return { text: 'Ready on the Pass', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 animate-pulse', icon: 'room_service' };
      case 'served': return { text: 'Served to Table', color: 'bg-[#1f2020] text-[#edbf7b] border-[#edbf7b]/40', icon: 'celebration' };
      default: return { text: status.toUpperCase(), color: 'bg-neutral-800 text-neutral-300', icon: 'info' };
    }
  };

  const totalSessionAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] pb-28 pt-16">
      <CustomerHeader title="Table Orders & Single Bill" showBack />

      <main className="max-w-md mx-auto px-4 sm:px-6 pt-4 space-y-5">
        {/* Table Strip */}
        <div className="p-3.5 rounded-2xl bg-[#1f2020] border border-[#edbf7b]/30 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#edbf7b] text-[22px]">table_restaurant</span>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#edbf7b] tracking-wider">
                Table {table?.tableNumber || 1} Dining Session
              </p>
              <p className="text-xs font-semibold text-[#e3e2e2]">
                {orders.length} {orders.length === 1 ? 'Order Placed' : 'Orders Placed'}
              </p>
            </div>
          </div>

          <Link
            to={`${baseRoute}/menu`}
            className="px-3 py-1.5 rounded-xl bg-[#edbf7b] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-md hover:bg-[#ffddb0] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add Dishes</span>
          </Link>
        </div>

        {/* Master Consolidated Bill Banner (One Bill for All Orders) */}
        {orders.length > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#262117] via-[#1f2020] to-[#121414] border border-[#edbf7b]/60 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-[#edbf7b]/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#edbf7b] text-[20px]">receipt_long</span>
                <span className="font-serif-heading text-sm font-bold text-[#e3e2e2]">
                  Consolidated Single Bill
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#edbf7b] text-[#442b00] font-bold text-[10px] uppercase">
                All {orders.length} Rounds
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-[#d2c4b4]/80">Combined Session Total:</span>
              <span className="font-serif-heading font-extrabold text-lg text-[#edbf7b]">
                ₹{totalSessionAmount.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleOpenConsolidatedBill}
              disabled={isLoadingConsolidated}
              className="w-full h-11 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98"
            >
              {isLoadingConsolidated ? (
                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>View & Download Complete Single Bill (PNG)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Orders List */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#edbf7b] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-[#d2c4b4]/60 uppercase tracking-wider">
              Loading Your Table Tickets...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center space-y-4 p-6 rounded-3xl bg-[#1f2020] border border-[#4f4539]/30 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-[#121414] border border-[#4f4539]/40 mx-auto flex items-center justify-center text-[#9b8f80]">
              <span className="material-symbols-outlined text-[32px]">dinner_dining</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-serif-heading text-lg font-bold text-[#e3e2e2]">No Orders Yet</h3>
              <p className="text-xs text-[#d2c4b4]/60">
                Explore our menu and place your first culinary selection.
              </p>
            </div>
            <Link
              to={`${baseRoute}/menu`}
              className="inline-block px-6 py-2.5 rounded-full bg-[#edbf7b] text-[#442b00] font-bold text-xs uppercase tracking-wider shadow-lg"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-serif-heading text-sm font-bold text-[#d2c4b4]">
              Individual Order Tickets ({orders.length})
            </h4>

            {orders.map((order, idx) => {
              const statusInfo = getStatusLabel(order.status);
              const paymentMethod = (order.paymentMethod || 'cash').toUpperCase();
              const isPaid = (order.paymentStatus || 'paid').toUpperCase() === 'PAID';

              return (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/35 space-y-3 shadow-lg text-xs"
                >
                  {/* Ticket Header */}
                  <div className="flex justify-between items-start pb-2.5 border-b border-[#4f4539]/30">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#edbf7b]">
                          #{order.orderNumber}
                        </span>
                        <span className="text-[10px] text-[#d2c4b4]/50">
                          (Round {orders.length - idx})
                        </span>
                      </div>
                      <p className="text-[10px] text-[#d2c4b4]/60 mt-0.5">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className={`px-2 py-0.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${statusInfo.color}`}>
                      <span className="material-symbols-outlined text-[13px]">{statusInfo.icon}</span>
                      <span>{statusInfo.text}</span>
                    </div>
                  </div>

                  {/* Dishes Itemized */}
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-[#e3e2e2]">
                        <span className="truncate pr-2 text-[11px]">
                          <strong className="text-[#edbf7b]">{item.quantity}×</strong> {item.menuItem.name}
                        </span>
                        <span className="font-semibold text-[#d2c4b4] text-[11px] shrink-0">
                          ₹{(item.priceAtOrder * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Payment & Amount Summary */}
                  <div className="pt-2 border-t border-[#4f4539]/30 flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-[#d2c4b4]/60 uppercase font-semibold">Payment</span>
                      <p className="text-[10px] font-bold text-[#e3e2e2]">
                        {paymentMethod} •{' '}
                        <span className={isPaid ? 'text-emerald-400' : 'text-amber-400'}>
                          {isPaid ? 'PAID ✓' : 'PENDING'}
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-[#d2c4b4]/60 uppercase font-semibold">Total</span>
                      <p className="font-serif-heading font-bold text-sm text-[#edbf7b]">
                        ₹{order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      to={`${baseRoute}/track/${order.id}`}
                      className="h-9 rounded-xl bg-[#121414] hover:bg-[#343535] border border-[#4f4539]/40 text-[#e3e2e2] font-semibold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#edbf7b]">stream</span>
                      <span>Live Tracker</span>
                    </Link>

                    <button
                      onClick={() => setActiveReceiptOrder(order)}
                      className="h-9 rounded-xl bg-[#1f2020] hover:bg-[#343535] text-[#edbf7b] font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 border border-[#edbf7b]/40 transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                      <span>Ticket Bill</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bill Receipt Modal */}
      {activeReceiptOrder && (
        <DigitalReceipt
          order={activeReceiptOrder}
          onClose={() => setActiveReceiptOrder(null)}
          isAdmin={false}
        />
      )}

      <CustomerBottomNav />
    </div>
  );
};
