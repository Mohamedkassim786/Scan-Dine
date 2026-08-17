import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { CustomerHeader } from '../../components/customer/CustomerHeader';
import { CustomerBottomNav } from '../../components/customer/CustomerBottomNav';
import { DigitalReceipt } from '../../components/common/DigitalReceipt';
import { Order } from '../../types';

export const OrderSuccessPage: React.FC = () => {
  const { slug, token, orderId } = useParams<{ slug: string; token: string; orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const baseRoute = `/r/${slug}/t/${token}`;

  useEffect(() => {
    if (orderId) {
      api
        .get(`/orders/${orderId}`)
        .then((res) => setOrder(res.data))
        .catch((err) => console.error(err));
    }
  }, [orderId]);

  const paymentMethod = (order?.paymentMethod || 'online').toUpperCase();
  const paymentStatus = (order?.paymentStatus || 'paid').toUpperCase();
  const isPaid = paymentStatus === 'PAID';

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] pb-28 pt-16 flex flex-col justify-between">
      <CustomerHeader title="Order Confirmation" />

      <main className="max-w-md mx-auto px-4 sm:px-6 pt-4 space-y-5 w-full text-center">
        {/* Animated Success Badge */}
        <div className="w-16 h-16 rounded-full bg-emerald-950/60 border-2 border-emerald-400 mx-auto flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.25)] animate-bounce">
          <span className="material-symbols-outlined text-[36px]">check</span>
        </div>

        <div className="space-y-1">
          <h2 className="font-serif-heading text-2xl font-extrabold text-[#e3e2e2]">
            {isPaid ? 'Payment Successful ✓' : 'Order Placed ✓'}
          </h2>
          <p className="text-xs text-[#d2c4b4]/80">
            {isPaid
              ? 'Thank you! Your payment has been verified and ticket transmitted to kitchen.'
              : 'Please settle your cash payment of total amount at the front counter.'}
          </p>
        </div>

        {/* Order & Payment Summary Card */}
        {order && (
          <div className="p-5 rounded-2xl bg-[#1f2020] border border-[#edbf7b]/40 space-y-3.5 shadow-xl text-left">
            <div className="flex justify-between items-center pb-2.5 border-b border-[#4f4539]/30">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#d2c4b4]/60 tracking-wider">
                  Order Number
                </span>
                <p className="font-mono text-base font-bold text-[#edbf7b]">#{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[#d2c4b4]/60 tracking-wider">
                  Dining Table
                </span>
                <p className="font-serif-heading text-base font-bold text-[#e3e2e2]">
                  Table {order.table?.tableNumber || 1}
                </p>
              </div>
            </div>

            {/* Payment & Amount Info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-[#121414] border border-[#4f4539]/30 space-y-0.5">
                <span className="text-[10px] text-[#d2c4b4]/60 uppercase font-semibold">Payment Mode</span>
                <p className="font-bold text-[#e3e2e2] uppercase">{paymentMethod}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121414] border border-[#4f4539]/30 space-y-0.5">
                <span className="text-[10px] text-[#d2c4b4]/60 uppercase font-semibold">Status</span>
                <p className={`font-bold uppercase ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {paymentStatus}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#4f4539]/30 flex justify-between items-center">
              <span className="text-xs font-semibold text-[#d2c4b4]">Grand Total</span>
              <span className="font-serif-heading text-xl font-bold text-[#edbf7b]">
                ₹{order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <div className="grid grid-cols-2 gap-2.5">
            {/* View Bill Button */}
            <button
              onClick={() => setIsReceiptOpen(true)}
              className="h-12 rounded-xl bg-[#1f2020] border border-[#edbf7b]/40 text-[#edbf7b] hover:bg-[#edbf7b]/10 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>View Bill</span>
            </button>

            {/* Download Bill Button */}
            <button
              onClick={() => setIsReceiptOpen(true)}
              className="h-12 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Download Bill</span>
            </button>
          </div>

          {/* Add More Dishes & Track Live Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              to={`${baseRoute}/menu`}
              className="h-12 rounded-xl bg-[#1f2020] hover:bg-[#343535] border border-[#edbf7b]/40 text-[#edbf7b] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Add More Dishes</span>
            </Link>

            <button
              onClick={() => navigate(`${baseRoute}/track/${orderId}`)}
              className="h-12 rounded-xl bg-[#1f2020] hover:bg-[#343535] border border-[#4f4539]/40 text-[#e3e2e2] font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-400">stream</span>
              <span>Track Live</span>
            </button>
          </div>

          {/* View All Table Orders */}
          <Link
            to={`${baseRoute}/orders`}
            className="block w-full py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[#d2c4b4] hover:text-[#edbf7b] transition-colors"
          >
            View All Orders for Table {order?.table?.tableNumber || 1}
          </Link>
        </div>
      </main>

      {/* Bill Receipt Modal (Customer Image Download Mode) */}
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
