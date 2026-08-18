import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useCustomerStore } from '../../store/useCustomerStore';

interface FinishDiningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionEnded?: () => void;
}

type ModalStep =
  | 'confirm' // "Are you finished dining? Would you like to get your final bill?"
  | 'loading' // Fetching session payment status
  | 'online_paid' // ✅ Your final bill is ready. Total: ₹850. Would you like to save your bill?
  | 'cash_pending' // 💵 Cash Payment. Select Pay Cash at Counter or wait for staff.
  | 'cashier_pass' // 🎫 Cashier Pass #A7F3 generated. Show to cashier.
  | 'cash_received' // ✅ Payment Received. Your final bill is ready.
  | 'thank_you'; // Thank you for dining with us!

export const FinishDiningModal: React.FC<FinishDiningModalProps> = ({
  isOpen,
  onClose,
  onSessionEnded,
}) => {
  const { session, restaurant, table } = useCustomerStore();
  const [step, setStep] = useState<ModalStep>('confirm');
  const [sessionData, setSessionData] = useState<any>(null);
  const [cashierPassCode, setCashierPassCode] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isClosingSession, setIsClosingSession] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
    }
  }, [isOpen]);

  // Real-time listener for cash payment confirmation when step is cash_pending or cashier_pass
  useEffect(() => {
    if ((step !== 'cash_pending' && step !== 'cashier_pass') || !session?.token) return;

    const checkStatus = async () => {
      try {
        const res = await api.get(`/sessions/status/${session.token}`);
        if (res.data && res.data.paymentStatus === 'paid') {
          setSessionData(res.data);
          setStep('cash_received');
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      }
    };

    const socket = getSocket();
    const handlePaymentUpdate = () => {
      checkStatus();
    };

    socket.on('payment-updated', handlePaymentUpdate);
    socket.on('order-status-update', handlePaymentUpdate);
    socket.on('table-settled', handlePaymentUpdate);

    const interval = setInterval(checkStatus, 2500);

    return () => {
      socket.off('payment-updated', handlePaymentUpdate);
      socket.off('order-status-update', handlePaymentUpdate);
      socket.off('table-settled', handlePaymentUpdate);
      clearInterval(interval);
    };
  }, [step, session?.token]);

  if (!isOpen) return null;

  // Handle "Yes, Finish" button tap
  const handleConfirmFinish = async () => {
    if (!session?.token) {
      onClose();
      return;
    }

    setStep('loading');
    try {
      const res = await api.get(`/sessions/status/${session.token}`);
      const data = res.data;
      setSessionData(data);

      if (!data.hasOrders) {
        // No orders placed, close directly with thank you
        await closeSession();
        setStep('thank_you');
        return;
      }

      if (data.paymentStatus === 'paid') {
        setStep('online_paid');
      } else if (data.status === 'frozen' && data.cashierPassCode) {
        setCashierPassCode(data.cashierPassCode);
        setStep('cashier_pass');
      } else {
        setStep('cash_pending');
      }
    } catch (err) {
      console.error('Failed to load session bill status:', err);
      onClose();
    }
  };

  // Handle Freeze For Cash / Pay Cash at Counter
  const handleFreezeForCash = async () => {
    if (!session?.token) return;
    setIsClosingSession(true);
    try {
      const res = await api.post('/sessions/freeze-for-cash', { sessionToken: session.token });
      if (res.data && res.data.cashierPassCode) {
        setCashierPassCode(res.data.cashierPassCode);
        setStep('cashier_pass');
      } else {
        setStep('cashier_pass');
      }
    } catch (err) {
      console.error('Failed to generate cashier pass:', err);
      setStep('cashier_pass');
    } finally {
      setIsClosingSession(false);
    }
  };

  // Close session backend API call
  const closeSession = async () => {
    if (!session?.token) return;
    setIsClosingSession(true);
    try {
      await api.post('/sessions/close', { sessionToken: session.token });
      // Remove local session storage
      if (restaurant?.slug) {
        localStorage.removeItem(`scan_dine_session_${restaurant.slug}`);
      }
    } catch (err) {
      console.error('Failed to close dining session:', err);
    } finally {
      setIsClosingSession(false);
    }
  };

  // Handle Download Bill image
  const handleDownloadBill = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        allowTaint: true,
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          closeSession();
          setStep('thank_you');
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${(restaurant?.name || 'Aurelian').replace(/\s+/g, '_')}_Final_Bill.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

        closeSession();
        setStep('thank_you');
      }, 'image/png', 1.0);
    } catch (err) {
      console.error('Error generating bill image:', err);
      await closeSession();
      setStep('thank_you');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle Skip button
  const handleSkip = async () => {
    await closeSession();
    setStep('thank_you');
  };

  // Handle final completion modal dismiss
  const handleFinishComplete = () => {
    if (onSessionEnded) {
      onSessionEnded();
    } else {
      window.location.reload();
    }
  };

  const totalAmount = sessionData?.totalAmount || 0;
  const subtotalAmount = sessionData?.subtotalAmount || 0;
  const taxAmount = sessionData?.taxAmount || 0;
  const serviceChargeAmount = sessionData?.serviceChargeAmount || 0;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="w-full max-w-md bg-[#1f2020] rounded-3xl border border-[#edbf7b]/40 p-6 space-y-5 shadow-2xl text-[#e3e2e2] relative">
        {/* Hidden high-res DOM container for html2canvas receipt rendering */}
        {sessionData && (
          <div style={{ position: 'fixed', top: 0, left: 0, opacity: 0.001, pointerEvents: 'none', zIndex: -100 }}>
            <div
              ref={receiptRef}
              className="bg-white text-neutral-900 rounded-2xl p-6 font-mono text-xs w-[360px] space-y-3"
            >
              {/* Header Brand */}
              <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-neutral-300">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  SCAN & DINE RECEIPT
                </p>
                <h2 className="font-serif font-black text-xl text-neutral-900 uppercase tracking-tight">
                  {restaurant?.name || sessionData.restaurant?.name || 'Aurelian'}
                </h2>
                <p className="text-[10px] text-neutral-600">
                  {restaurant?.address || sessionData.restaurant?.address || 'Greenwich, London'}
                </p>
                <p className="text-[10px] text-neutral-600">
                  Phone: {restaurant?.phone || sessionData.restaurant?.phone || '+44 20 7946 0912'}
                </p>
              </div>

              {/* Metadata */}
              <div className="py-2 border-b-2 border-dashed border-neutral-300 text-[11px] space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Order #: {sessionData.orderNumber || '#A-101'}</span>
                  <span>Table: {table?.tableNumber || sessionData.tableNumber || 1}</span>
                </div>
                <div className="flex justify-between text-neutral-600 text-[10px]">
                  <span>Date: {dateStr}</span>
                  <span>Time: {timeStr}</span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="py-2 border-b-2 border-dashed border-neutral-300 space-y-1.5">
                <div className="grid grid-cols-12 font-bold uppercase text-[9px] text-neutral-500 pb-1 border-b border-neutral-200">
                  <span className="col-span-6">ITEM</span>
                  <span className="col-span-2 text-center">QTY</span>
                  <span className="col-span-2 text-right">PRICE</span>
                  <span className="col-span-2 text-right">TOTAL</span>
                </div>

                {sessionData.items?.map((item: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 text-[11px] items-center">
                    <span className="col-span-6 font-semibold truncate text-neutral-900">
                      {item.menuItem?.name || item.name}
                    </span>
                    <span className="col-span-2 text-center text-neutral-700">{item.quantity}</span>
                    <span className="col-span-2 text-right text-neutral-700">₹{item.priceAtOrder || item.price}</span>
                    <span className="col-span-2 text-right font-bold text-neutral-900">
                      ₹{((item.priceAtOrder || item.price) * item.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Summary Breakdown */}
              <div className="py-2 border-b-2 border-dashed border-neutral-300 space-y-1 text-[11px]">
                <div className="flex justify-between text-neutral-700">
                  <span>Subtotal</span>
                  <span>₹{subtotalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-700">
                  <span>GST / Tax</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                {serviceChargeAmount > 0 && (
                  <div className="flex justify-between text-neutral-700">
                    <span>Service Charge</span>
                    <span>₹{serviceChargeAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-700">
                  <span>Discount</span>
                  <span>₹0.00</span>
                </div>

                <div className="flex justify-between items-center pt-2 font-black text-sm text-neutral-900 border-t border-neutral-200">
                  <span>GRAND TOTAL</span>
                  <span className="font-serif text-base">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="py-2 border-b-2 border-dashed border-neutral-300 text-[10px] space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Payment Method:</span>
                  <span className="uppercase">{sessionData.paymentMethod || 'ONLINE'}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Payment Status:</span>
                  <span className="text-emerald-700 uppercase">PAID ✓</span>
                </div>
                {sessionData.transactionId && (
                  <div className="flex justify-between text-neutral-600 text-[9px]">
                    <span>Transaction ID:</span>
                    <span>{sessionData.transactionId}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-2 space-y-0.5 text-[10px] text-neutral-500">
                <p className="font-serif italic font-bold text-neutral-800">
                  Thank you for dining with us!
                </p>
                <p className="text-[9px]">Scan & Dine Hospitality System</p>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: CONFIRMATION ── */}
        {step === 'confirm' && (
          <div className="space-y-6 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-[#121414] border border-[#edbf7b]/40 mx-auto flex items-center justify-center text-[#edbf7b] shadow-inner">
              <span className="material-symbols-outlined text-[34px]">restaurant</span>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif-heading text-2xl font-bold text-[#e3e2e2]">
                Are you finished dining?
              </h2>
              <p className="text-sm text-[#d2c4b4]/80">
                Would you like to get your final bill?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={onClose}
                className="h-12 rounded-xl bg-[#121414] hover:bg-[#2e2f2f] border border-[#4f4539]/40 text-[#d2c4b4] hover:text-[#e3e2e2] font-semibold text-xs uppercase tracking-wider transition-all"
              >
                Not Yet
              </button>

              <button
                onClick={handleConfirmFinish}
                className="h-12 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-98"
              >
                Yes, Finish
              </button>
            </div>
          </div>
        )}

        {/* ── LOADING STATE ── */}
        {step === 'loading' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-12 h-12 border-3 border-[#edbf7b] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-[#d2c4b4] uppercase tracking-wider">
              Checking final bill & payment status...
            </p>
          </div>
        )}

        {/* ── STEP 2A: ONLINE PAYMENT — ALREADY PAID ── */}
        {step === 'online_paid' && (
          <div className="space-y-6 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/50 mx-auto flex items-center justify-center text-emerald-400 shadow-inner">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif-heading text-xl font-bold text-[#e3e2e2]">
                ✅ Your final bill is ready
              </h2>
              <div className="p-4 rounded-2xl bg-[#121414] border border-[#edbf7b]/30">
                <span className="text-xs uppercase font-bold tracking-wider text-[#d2c4b4]/60">Total Bill Amount</span>
                <p className="font-serif-heading text-3xl font-extrabold text-[#edbf7b] mt-1">
                  ₹{totalAmount.toFixed(2)}
                </p>
              </div>
              <p className="text-xs text-[#d2c4b4] pt-1">
                Would you like to save your bill?
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleDownloadBill}
                disabled={isDownloading}
                className="w-full h-12 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                {isDownloading ? (
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    <span>Download Bill</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSkip}
                disabled={isClosingSession}
                className="w-full h-10 rounded-xl bg-[#121414] hover:bg-[#2e2f2f] text-xs font-semibold text-[#d2c4b4] hover:text-[#e3e2e2] transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2B: CASH PAYMENT — PAYMENT PENDING ── */}
        {step === 'cash_pending' && (
          <div className="space-y-6 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-amber-950/60 border border-amber-500/50 mx-auto flex items-center justify-center text-amber-300 shadow-inner animate-pulse">
              <span className="material-symbols-outlined text-[36px]">payments</span>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif-heading text-xl font-bold text-[#e3e2e2]">
                💵 Cash Payment
              </h2>
              <div className="p-4 rounded-2xl bg-[#121414] border border-amber-500/30 space-y-1">
                <p className="text-sm font-semibold text-[#e3e2e2]">
                  Your final bill is <span className="font-serif-heading font-extrabold text-amber-300 text-lg">₹{totalAmount.toFixed(2)}</span>.
                </p>
                <p className="text-xs font-bold text-[#edbf7b]">
                  Pay at counter or wait for staff.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleFreezeForCash}
                disabled={isClosingSession}
                className="w-full h-12 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                {isClosingSession ? (
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
                    <span>Pay Cash at Counter</span>
                  </>
                )}
              </button>

              <div className="p-3 rounded-xl bg-[#121414] border border-[#4f4539]/30 flex items-center justify-center gap-2 text-xs text-[#d2c4b4]/70">
                <span className="material-symbols-outlined text-[16px] text-[#edbf7b] animate-spin">sync</span>
                <span>Or wait for staff to collect at table...</span>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2B-ALT: CASHIER PASS GENERATED ── */}
        {step === 'cashier_pass' && (
          <div className="space-y-5 text-center py-2 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#edbf7b]/20 border border-[#edbf7b]/60 mx-auto flex items-center justify-center text-[#edbf7b] shadow-xl">
              <span className="material-symbols-outlined text-[36px]">receipt_long</span>
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-[#edbf7b] text-[#442b00] font-bold text-[10px] uppercase tracking-widest">
                Cashier Pass Issued
              </span>
              <h2 className="font-serif-heading text-2xl font-bold text-[#e3e2e2] pt-1">
                Pass Code #{cashierPassCode || sessionData?.cashierPassCode || 'A7F3'}
              </h2>
              <p className="text-xs text-[#d2c4b4]/80 max-w-xs mx-auto">
                Please show this pass code to the cashier to pay cash.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#121414] border border-[#edbf7b]/30 space-y-1 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60">Total Cash Due</span>
              <p className="font-serif-heading text-3xl font-black text-[#edbf7b]">
                ₹{totalAmount.toFixed(2)}
              </p>
              <p className="text-[11px] text-emerald-400 font-semibold pt-1">
                ✓ Table {table?.tableNumber || sessionData?.tableNumber || 1} has been freed for incoming guests
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#121414] border border-[#4f4539]/30 flex items-center justify-center gap-2.5 text-xs text-[#d2c4b4]/70">
              <span className="material-symbols-outlined text-[18px] text-[#edbf7b] animate-spin">sync</span>
              <span>Waiting for cashier payment confirmation...</span>
            </div>
          </div>
        )}

        {/* ── STEP 2C: CASH PAYMENT — STAFF CONFIRMS PAYMENT ── */}
        {step === 'cash_received' && (
          <div className="space-y-6 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/50 mx-auto flex items-center justify-center text-emerald-400 shadow-inner">
              <span className="material-symbols-outlined text-[36px]">verified</span>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif-heading text-xl font-bold text-[#e3e2e2]">
                ✅ Payment Received
              </h2>
              <p className="text-sm font-semibold text-[#d2c4b4]">
                Your final bill is ready.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleDownloadBill}
                disabled={isDownloading}
                className="w-full h-12 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                {isDownloading ? (
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    <span>Download Bill</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSkip}
                disabled={isClosingSession}
                className="w-full h-10 rounded-xl bg-[#121414] hover:bg-[#2e2f2f] text-xs font-semibold text-[#d2c4b4] hover:text-[#e3e2e2] transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: THANK YOU & SESSION CLOSED ── */}
        {step === 'thank_you' && (
          <div className="space-y-6 text-center py-4 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#edbf7b]/20 to-[#121414] border border-[#edbf7b]/50 mx-auto flex items-center justify-center text-[#edbf7b] shadow-2xl">
              <span className="material-symbols-outlined text-[44px]">celebration</span>
            </div>

            <div className="space-y-3">
              <h2 className="font-serif-heading text-2xl font-bold text-[#edbf7b]">
                Thank you for dining with us!
              </h2>
              <p className="text-xs text-[#d2c4b4]/80 max-w-xs mx-auto leading-relaxed">
                Your dining session has concluded. We hope you had a wonderful culinary experience.
              </p>
            </div>

            <button
              onClick={handleFinishComplete}
              className="w-full h-12 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider transition-all shadow-lg mt-2"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
