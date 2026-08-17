import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

export interface ReceiptOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  table?: { tableNumber: number };
  restaurant?: {
    name?: string;
    logoUrl?: string;
    address?: string;
    phone?: string;
    taxPercentage?: number;
    serviceChargePercentage?: number;
  };
  items: Array<{
    id: string;
    quantity: number;
    priceAtOrder: number;
    menuItem: {
      name: string;
      price?: number;
    };
  }>;
  subtotalAmount?: number;
  taxAmount: number;
  serviceChargeAmount?: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus?: string;
  payments?: Array<{
    method: string;
    status: string;
    transactionId?: string;
    paidAt?: string;
  }>;
}

interface DigitalReceiptProps {
  order: ReceiptOrder;
  onClose?: () => void;
  isAdmin?: boolean;
}

export const DigitalReceipt: React.FC<DigitalReceiptProps> = ({ order, onClose, isAdmin = false }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [printFormat, setPrintFormat] = useState<'thermal80' | 'thermal58' | 'standard'>('thermal80');

  const payment = order.payments?.[0];
  const paymentMethod = (order.paymentMethod || payment?.method || 'cash').toUpperCase();
  const paymentStatus = (order.paymentStatus || payment?.status || 'paid').toUpperCase();
  const isPaid = paymentStatus === 'PAID';

  const subtotal = order.subtotalAmount || order.items.reduce((s, i) => s + i.priceAtOrder * i.quantity, 0);
  const tax = order.taxAmount || Math.round(subtotal * 0.05 * 100) / 100;
  const serviceCharge = order.serviceChargeAmount || 0;
  const total = order.totalAmount || (subtotal + tax + serviceCharge);

  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = orderDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDownloadPNG = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    try {
      // High-res retina capture
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Aurelian_Bill_Order_${order.orderNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export PNG bill image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="w-full max-w-md bg-[#1f2020] rounded-3xl border border-[#edbf7b]/40 p-4 sm:p-6 space-y-4 shadow-2xl print:border-none print:shadow-none print:p-0 print:max-w-none print:bg-white text-[#e3e2e2]">
        {/* Modal Controls (Hidden during print) */}
        <div className="flex items-center justify-between pb-3 border-b border-[#4f4539]/30 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-serif-heading font-bold text-base text-[#edbf7b]">
              {isAdmin ? 'Printable Order Bill' : 'Your Digital Dining Receipt'}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                isPaid
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
              }`}
            >
              {paymentStatus}
            </span>
          </div>

          {onClose && (
            <button onClick={onClose} className="p-1 rounded-lg text-[#9b8f80] hover:text-[#e3e2e2]">
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Admin Thermal Width Selector (Hidden on customer view & during print) */}
        {isAdmin && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#121414] border border-[#4f4539]/30 text-xs print:hidden">
            <span className="text-[11px] text-[#d2c4b4]/70 font-semibold">Printer Format:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPrintFormat('thermal80')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                  printFormat === 'thermal80' ? 'bg-[#edbf7b] text-[#442b00]' : 'text-[#d2c4b4] hover:text-[#e3e2e2]'
                }`}
              >
                80mm Thermal
              </button>
              <button
                onClick={() => setPrintFormat('thermal58')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                  printFormat === 'thermal58' ? 'bg-[#edbf7b] text-[#442b00]' : 'text-[#d2c4b4] hover:text-[#e3e2e2]'
                }`}
              >
                58mm Thermal
              </button>
              <button
                onClick={() => setPrintFormat('standard')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                  printFormat === 'standard' ? 'bg-[#edbf7b] text-[#442b00]' : 'text-[#d2c4b4] hover:text-[#e3e2e2]'
                }`}
              >
                A4 Standard
              </button>
            </div>
          </div>
        )}

        {/* Receipt Canvas (White paper aesthetic for crystal clear PNG & Thermal Print) */}
        <div
          ref={receiptRef}
          className={`bg-white text-neutral-900 rounded-2xl p-5 sm:p-6 font-mono text-xs shadow-inner mx-auto ${
            printFormat === 'thermal58'
              ? 'max-w-[260px] text-[10px] p-3'
              : printFormat === 'thermal80'
              ? 'max-w-[340px] text-[11px] p-4'
              : 'max-w-md text-xs'
          } print:max-w-none print:w-full print:shadow-none print:rounded-none`}
        >
          {/* Header Brand */}
          <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-neutral-300">
            <div className="flex items-center justify-center gap-1.5 font-bold uppercase tracking-widest text-neutral-400 text-[10px]">
              <span>SCAN & DINE</span>
            </div>
            <h2 className="font-serif font-black text-lg tracking-tight text-neutral-900 uppercase">
              {order.restaurant?.name || 'Aurelian Gastronomy'}
            </h2>
            <p className="text-[10px] text-neutral-600 leading-tight">
              {order.restaurant?.address || '42 Royal Observatory Way, Greenwich'}
            </p>
            <p className="text-[10px] text-neutral-600">
              Tel: {order.restaurant?.phone || '+44 20 7946 0912'} • GSTIN: 27AADCA1234F1Z8
            </p>
          </div>

          {/* Ticket Metadata */}
          <div className="py-2.5 border-b-2 border-dashed border-neutral-300 text-[11px] space-y-1">
            <div className="flex justify-between font-bold">
              <span>Order No: #{order.orderNumber}</span>
              <span className="px-2 py-0.5 bg-neutral-100 rounded text-neutral-800">
                Table: {order.table?.tableNumber || 1}
              </span>
            </div>
            <div className="flex justify-between text-neutral-600 text-[10px]">
              <span>Date: {formattedDate}</span>
              <span>Time: {formattedTime}</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-3 border-b-2 border-dashed border-neutral-300 space-y-2">
            <div className="grid grid-cols-12 font-bold uppercase text-[9px] text-neutral-500 pb-1 border-b border-neutral-200">
              <span className="col-span-6">ITEM</span>
              <span className="col-span-2 text-center">QTY</span>
              <span className="col-span-2 text-right">PRICE</span>
              <span className="col-span-2 text-right">TOTAL</span>
            </div>

            <div className="space-y-1.5">
              {order.items.map((item) => {
                const itemTotal = item.quantity * item.priceAtOrder;
                return (
                  <div key={item.id} className="grid grid-cols-12 text-[11px] items-center">
                    <span className="col-span-6 font-semibold truncate text-neutral-900">
                      {item.menuItem.name}
                    </span>
                    <span className="col-span-2 text-center text-neutral-700">{item.quantity}</span>
                    <span className="col-span-2 text-right text-neutral-700">₹{item.priceAtOrder.toFixed(0)}</span>
                    <span className="col-span-2 text-right font-bold text-neutral-900">
                      ₹{itemTotal.toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="py-2.5 border-b-2 border-dashed border-neutral-300 space-y-1 text-[11px]">
            <div className="flex justify-between text-neutral-700">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>GST / Tax (5%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            {serviceCharge > 0 && (
              <div className="flex justify-between text-neutral-700">
                <span>Service Charge</span>
                <span>₹{serviceCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-700">
              <span>Discount</span>
              <span>₹0.00</span>
            </div>

            <div className="flex justify-between items-center pt-2 font-black text-sm text-neutral-900 border-t border-neutral-200">
              <span>GRAND TOTAL</span>
              <span className="font-serif font-black text-base">₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment & Settlement Confirmation */}
          <div className="py-2.5 border-b-2 border-dashed border-neutral-300 space-y-1 text-[10px]">
            <div className="flex justify-between font-bold">
              <span>Payment Mode:</span>
              <span className="uppercase">{paymentMethod}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Payment Status:</span>
              <span className={isPaid ? 'text-emerald-700 font-extrabold' : 'text-amber-700 font-extrabold'}>
                {paymentStatus}
              </span>
            </div>
            {paymentMethod === 'ONLINE' ? (
              <div className="flex justify-between text-neutral-600 font-mono text-[9px]">
                <span>Txn Ref:</span>
                <span className="truncate max-w-[160px]">{payment?.transactionId || `UPI-${order.orderNumber}`}</span>
              </div>
            ) : (
              <div className="flex justify-between text-neutral-600">
                <span>Settlement:</span>
                <span>{isPaid ? 'Paid & Verified at Counter' : 'Pending Cash at Counter'}</span>
              </div>
            )}
            {payment?.paidAt && (
              <div className="flex justify-between text-neutral-500 text-[9px]">
                <span>Settled At:</span>
                <span>{new Date(payment.paidAt).toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center pt-3 space-y-1 text-[10px] text-neutral-500">
            <p className="font-serif italic font-bold text-neutral-800">
              Thank you for dining with us at Aurelian.
            </p>
            <p className="text-[9px]">Powered by Scan & Dine Smart Hospitality</p>
          </div>
        </div>

        {/* Action Buttons (Customer PNG Download vs Admin Print) */}
        <div className="space-y-2 pt-2 print:hidden">
          {/* CUSTOMER ACTION: Download Bill as PNG Image */}
          {!isAdmin && (
            <button
              onClick={handleDownloadPNG}
              disabled={isDownloading}
              className="w-full h-12 rounded-2xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all"
            >
              {isDownloading ? (
                <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  <span>Download Bill (PNG Image)</span>
                </>
              )}
            </button>
          )}

          {/* ADMIN ACTION: Print Bill Directly (Thermal or Normal) */}
          {isAdmin && (
            <button
              onClick={handlePrint}
              className="w-full h-12 rounded-2xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
              <span>Print Bill Directly</span>
            </button>
          )}

          {/* Back to Menu or Dismiss Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="w-full h-10 rounded-xl bg-[#121414] hover:bg-[#343535] text-xs font-semibold text-[#d2c4b4] hover:text-[#e3e2e2] transition-colors"
            >
              Close Receipt
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
