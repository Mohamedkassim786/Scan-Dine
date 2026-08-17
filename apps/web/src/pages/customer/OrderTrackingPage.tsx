import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { CustomerHeader } from '../../components/customer/CustomerHeader';
import { CustomerBottomNav } from '../../components/customer/CustomerBottomNav';
import { DigitalReceipt } from '../../components/common/DigitalReceipt';
import { Order } from '../../types';

export const OrderTrackingPage: React.FC = () => {
  const { slug, token, orderId } = useParams<{ slug: string; token: string; orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const baseRoute = `/r/${slug}/t/${token}`;

  useEffect(() => {
    if (!orderId) return;

    // Fetch order initially
    api
      .get(`/orders/${orderId}`)
      .then((res) => setOrder(res.data))
      .catch((err) => console.error(err));

    // Connect to live WebSocket room for this order
    const socket = getSocket();
    socket.emit('join-order', orderId);

    const handleStatusUpdate = (data: { orderId: string; status: string; order: Order }) => {
      console.log('🔔 Received Live Order Update:', data);
      if (data.orderId === orderId) {
        setOrder(data.order);
      }
    };

    socket.on('order-status-update', handleStatusUpdate);

    // Fast polling every 2.5 seconds
    const interval = setInterval(() => {
      api.get(`/orders/${orderId}`).then((res) => {
        setOrder(res.data);
      }).catch(() => {});
    }, 2500);

    return () => {
      socket.off('order-status-update', handleStatusUpdate);
      clearInterval(interval);
    };
  }, [orderId]);

  const stages = [
    { key: 'new', label: 'Order Received', icon: 'receipt_long', desc: 'Sent directly to the kitchen display' },
    { key: 'accepted', label: 'Accepted by Kitchen', icon: 'check_circle', desc: 'Executive Chef reviewed your ticket' },
    { key: 'preparing', label: 'Preparing & Plating', icon: 'skillet', desc: 'Culinary team is actively crafting your dishes' },
    { key: 'ready', label: 'Ready on the Pass', icon: 'room_service', desc: 'Plated, inspected, and waiting for runner' },
    { key: 'served', label: 'Served to Table', icon: 'done_all', desc: 'Delivered to your table. Enjoy your meal!' },
  ];

  const getStageIndex = (status?: string) => {
    switch (status?.toLowerCase()?.trim()) {
      case 'new': return 0;
      case 'accepted': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'served': return 4;
      default: return 0;
    }
  };

  const currentStep = getStageIndex(order?.status);

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] pb-28 pt-16">
      <CustomerHeader title="Live Order Tracking" showBack />

      <main className="max-w-md mx-auto px-4 sm:px-6 pt-4 space-y-6">
        {/* Special Highlight Banner for "Ready on Pass" / "Served" */}
        {order?.status === 'ready' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-[#1f2020] border-2 border-emerald-400/80 shadow-2xl flex items-center gap-3.5 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shrink-0">
              <span className="material-symbols-outlined text-[26px]">room_service</span>
            </div>
            <div>
              <p className="font-serif-heading font-bold text-sm text-emerald-300">
                Dishes Ready on the Pass!
              </p>
              <p className="text-[11px] text-[#e3e2e2]/80 mt-0.5 leading-tight">
                Your food is freshly plated. Table runner is serving it to Table {order.table?.tableNumber || 1} right now.
              </p>
            </div>
          </div>
        )}

        {order?.status === 'served' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#edbf7b]/20 to-[#1f2020] border border-[#edbf7b] shadow-2xl flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#edbf7b]/30 border border-[#edbf7b] flex items-center justify-center text-[#edbf7b] shrink-0">
              <span className="material-symbols-outlined text-[26px]">celebration</span>
            </div>
            <div>
              <p className="font-serif-heading font-bold text-sm text-[#edbf7b]">
                Served to Your Table
              </p>
              <p className="text-[11px] text-[#e3e2e2]/80 mt-0.5">
                Bon Appétit! Feel free to explore our dessert & cocktail cellar.
              </p>
            </div>
          </div>
        )}

        {/* Live Status Header */}
        <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#edbf7b]/30 flex items-center justify-between shadow-xl">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-[#edbf7b] tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Kitchen Progress
            </span>
            <p className="font-mono text-base font-bold text-[#e3e2e2]">#{order?.orderNumber}</p>
            <p className="text-xs text-[#d2c4b4]/70">Table {order?.table?.tableNumber || 1}</p>
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-[#edbf7b]/15 border border-[#edbf7b]/40 text-[#edbf7b] font-serif-heading font-bold text-xs uppercase tracking-wider">
            {order?.status?.toUpperCase() || 'NEW'}
          </div>
        </div>

        {/* Vertical Tracking Stepper */}
        <div className="p-5 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-6 shadow-xl">
          <h3 className="font-serif-heading text-lg font-bold text-[#e3e2e2]">Kitchen Workflow</h3>

          <div className="space-y-6 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#4f4539]/30">
            {stages.map((stage, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div key={stage.key} className="flex items-start gap-4 relative z-10">
                  {/* Step Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-[#edbf7b] text-[#442b00] ring-4 ring-[#edbf7b]/20 shadow-lg scale-110'
                        : isPast
                        ? 'bg-emerald-500 text-[#121414]'
                        : 'bg-[#121414] text-[#9b8f80] border border-[#4f4539]/40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isPast ? 'check' : stage.icon}
                    </span>
                  </div>

                  {/* Step Text */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-sm font-semibold ${
                          isCurrent
                            ? 'text-[#edbf7b] font-bold'
                            : isPast
                            ? 'text-[#e3e2e2]'
                            : 'text-[#d2c4b4]/40'
                        }`}
                      >
                        {stage.label}
                      </h4>
                      {isPast && (
                        <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                          Done
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-bold uppercase text-[#edbf7b] bg-[#edbf7b]/15 px-2 py-0.5 rounded border border-[#edbf7b]/40 animate-pulse">
                          Active Now
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#d2c4b4]/70 mt-0.5 leading-relaxed">
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button: View & Download Bill */}
        {order && (
          <div className="space-y-3">
            <button
              onClick={() => setIsReceiptOpen(true)}
              className="w-full h-12 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>View & Download Bill (PNG)</span>
            </button>

            <Link
              to={`${baseRoute}/menu`}
              className="block w-full py-2 text-center text-xs font-semibold uppercase tracking-wider text-[#d2c4b4] hover:text-[#edbf7b] transition-colors"
            >
              Add More Dishes
            </Link>
          </div>
        )}
      </main>

      {/* Bill Receipt Modal */}
      {isReceiptOpen && order && (
        <DigitalReceipt
          order={order as any}
          onClose={() => setIsReceiptOpen(false)}
          isAdmin={false}
        />
      )}

      <CustomerBottomNav />
    </div>
  );
};
