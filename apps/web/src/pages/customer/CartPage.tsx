import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useCustomerStore } from '../../store/useCustomerStore';
import { CustomerHeader } from '../../components/customer/CustomerHeader';
import { CustomerBottomNav } from '../../components/customer/CustomerBottomNav';
import { DigitalReceipt } from '../../components/common/DigitalReceipt';
import { Order } from '../../types';
import { formatImageUrl } from '../../utils/image';

export const CartPage: React.FC = () => {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const navigate = useNavigate();
  const { cart, table, session, fetchCart, updateCartItem, removeFromCart, placeOrder } = useCustomerStore();
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [sessionOrders, setSessionOrders] = useState<Order[]>([]);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);

  const hasUnavailableItems = cart.items.some((item: any) => item.isAvailable === false);
  
  // Payment Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'counter' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('guest@okhdfcbank');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const baseRoute = `/r/${slug}/t/${token}`;

  useEffect(() => {
    fetchSessionOrders();
    fetchCart();

    const socket = getSocket();
    const handleUpdate = () => {
      fetchSessionOrders();
      fetchCart();
    };

    const handleAvailabilityChange = () => {
      fetchCart();
    };

    socket.on('new-order', handleUpdate);
    socket.on('order-status-update', handleUpdate);
    socket.on('menu-availability-changed', handleAvailabilityChange);

    const interval = setInterval(() => {
      fetchSessionOrders();
      fetchCart();
    }, 4000);

    return () => {
      socket.off('new-order', handleUpdate);
      socket.off('order-status-update', handleUpdate);
      socket.off('menu-availability-changed', handleAvailabilityChange);
      clearInterval(interval);
    };
  }, [token, session?.token]);

  const fetchSessionOrders = async () => {
    const activeToken = token || session?.token;
    if (!activeToken) return;
    try {
      const res = await api.get(`/orders?sessionToken=${activeToken}`);
      setSessionOrders(res.data || []);
    } catch {}
  };

  const handleInitiateCheckout = () => {
    if (cart.items.length === 0) return;
    setIsPaymentModalOpen(true);
  };

  const handleProcessPayment = async () => {
    setPaymentProcessing(true);
    setOrderError(null);

    // Simulate instant gateway processing
    setTimeout(async () => {
      try {
        setPaymentSuccess(true);
        const isOnline = paymentMethod !== 'counter';
        const method = isOnline ? paymentMethod : 'cash';
        const txnId = isOnline
          ? (paymentMethod === 'upi'
              ? (upiId.trim() ? `UPI-${upiId.trim()}` : `UPI-${Math.floor(100000 + Math.random() * 900000)}`)
              : `CARD-${Math.floor(100000 + Math.random() * 900000)}`)
          : 'CASH-COUNTER';

        // Place real order in the backend database with accurate payment method
        const order = await placeOrder(
          specialInstructions,
          method,
          txnId
        );

        setTimeout(() => {
          setIsPaymentModalOpen(false);
          navigate(`${baseRoute}/order-success/${order.id}`);
        }, 1000);
      } catch (err: any) {
        setPaymentProcessing(false);
        setPaymentSuccess(false);
        setOrderError(err.response?.data?.error || 'Payment failed. Please try again.');
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] pb-36 pt-16">
      <CustomerHeader title="Your Order & Cart" showBack />

      <main className="max-w-xl mx-auto px-4 sm:px-6 pt-4 space-y-6">
        {/* Table Confirmation Strip + Add More Dishes Action */}
        <div className="p-3.5 rounded-xl bg-[#1f2020] border border-[#edbf7b]/30 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#edbf7b] text-[20px]">table_restaurant</span>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#edbf7b] tracking-wider">Direct Table Ordering</p>
              <p className="text-xs font-semibold text-[#e3e2e2]">Table {table?.tableNumber || 1} • Active Seating</p>
            </div>
          </div>
          
          <Link
            to={`${baseRoute}/menu`}
            className="px-3 py-1.5 rounded-xl bg-[#121414] border border-[#edbf7b]/40 text-[#edbf7b] hover:bg-[#edbf7b] hover:text-[#442b00] text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>Add Dishes</span>
          </Link>
        </div>

        {/* Previously Placed Orders in Kitchen for this Table */}
        {sessionOrders.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#181a1a] border border-emerald-500/35 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#4f4539]/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">skillet</span>
                <h4 className="font-serif-heading text-sm font-bold text-[#e3e2e2]">
                  Your Placed Orders in Kitchen ({sessionOrders.length})
                </h4>
              </div>
              <Link
                to={`${baseRoute}/orders`}
                className="text-[11px] font-bold text-[#edbf7b] hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {sessionOrders.map((prevOrder) => (
                <div
                  key={prevOrder.id}
                  className="p-3 rounded-xl bg-[#121414] border border-[#4f4539]/30 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#edbf7b]">#{prevOrder.orderNumber}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                        {prevOrder.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#d2c4b4]/70 truncate">
                      {prevOrder.items.map((i) => `${i.quantity}× ${i.menuItem.name}`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-[#edbf7b]">₹{prevOrder.totalAmount.toFixed(0)}</span>
                    <button
                      onClick={() => setActiveReceiptOrder(prevOrder)}
                      className="px-2 py-1 rounded bg-[#1f2020] hover:bg-[#343535] text-[#d2c4b4] hover:text-[#edbf7b] text-[10px] font-semibold uppercase border border-[#4f4539]/30 transition-colors"
                    >
                      Bill
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Cart Items List */}
        {cart.items.length === 0 ? (
          <div className="py-12 text-center space-y-4 p-6 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 shadow-xl">
            <div className="w-14 h-14 rounded-full bg-[#121414] border border-[#4f4539]/40 mx-auto flex items-center justify-center text-[#9b8f80]">
              <span className="material-symbols-outlined text-[28px]">shopping_bag</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-serif-heading text-lg font-bold text-[#e3e2e2]">Your current cart is empty</h3>
              <p className="text-xs text-[#d2c4b4]/60">
                {sessionOrders.length > 0
                  ? 'Your previous orders are cooking in the kitchen. Add more dishes anytime!'
                  : 'Explore our seasonal menu to add delicious items.'}
              </p>
            </div>
            <Link
              to={`${baseRoute}/menu`}
              className="inline-block px-6 py-2.5 rounded-full bg-[#edbf7b] text-[#442b00] font-bold text-xs uppercase tracking-wider shadow-lg"
            >
              Add Dishes to Cart
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {hasUnavailableItems && (
              <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-400 text-[20px]">warning</span>
                  <div>
                    <p className="font-bold">⚠️ Some items in your order are currently unavailable.</p>
                    <p className="text-[11px] text-rose-300/80">Please remove unavailable items to proceed to checkout.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="font-serif-heading text-lg font-bold text-[#e3e2e2]">New Dishes to Order</h3>
              <span className="text-xs text-[#d2c4b4]/60">{cart.items.length} Items</span>
            </div>

            <div className="space-y-3">
              {cart.items.map((item: any) => {
                const isItemAvailable = item.isAvailable !== false;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl flex items-center gap-3.5 shadow-sm border transition-all ${
                      isItemAvailable
                        ? 'bg-[#1f2020] border-[#4f4539]/25'
                        : 'bg-[#181414] border-rose-500/50 text-rose-100'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={formatImageUrl(item.imageUrl)}
                        alt={item.name}
                        className={`w-16 h-16 rounded-lg object-cover bg-[#121414] ${
                          !isItemAvailable ? 'grayscale opacity-60' : ''
                        }`}
                        onError={(e: any) => {
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      {!isItemAvailable && (
                        <span className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center text-[9px] font-bold text-rose-300 uppercase tracking-tighter text-center p-0.5">
                          Unavailable
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif-heading font-semibold text-sm text-[#e3e2e2] truncate">
                          {item.name}
                        </h4>
                        {!isItemAvailable && (
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 text-[9px] font-bold uppercase shrink-0">
                            Unavailable
                          </span>
                        )}
                      </div>

                      <p className="text-[#edbf7b] font-bold text-xs mt-0.5">₹{item.price.toFixed(2)}</p>
                      {item.specialInstructions && (
                        <p className="text-[10px] text-[#d2c4b4]/60 italic truncate mt-0.5">
                          {item.specialInstructions}
                        </p>
                      )}
                    </div>

                    {/* Quantity Stepper & Remove */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-[#121414] rounded-full border border-[#4f4539]/40 h-8 px-1">
                        <button
                          onClick={() => updateCartItem(item.menuItemId, item.quantity - 1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[#d2c4b4] hover:text-[#e3e2e2]"
                        >
                          <span className="material-symbols-outlined text-[14px]">remove</span>
                        </button>
                        <span className="w-5 text-center font-bold text-xs text-[#e3e2e2]">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItem(item.menuItemId, item.quantity + 1)}
                          disabled={!isItemAvailable}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[#d2c4b4] hover:text-[#e3e2e2] disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="text-[#9b8f80] hover:text-rose-400 p-1"
                        title="Remove item"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Special Instructions */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-[#d2c4b4]">Kitchen Notes & Preferences</label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Allergies, spice preference, or special requests..."
                rows={2}
                className="w-full bg-[#1f2020] border border-[#4f4539]/30 rounded-xl p-3 text-xs text-[#e3e2e2] placeholder-[#d2c4b4]/40 focus:outline-none focus:border-[#edbf7b]"
              />
            </div>

            {/* Bill Summary Breakdown */}
            <div className="p-4 rounded-xl bg-[#1f2020] border border-[#4f4539]/25 space-y-2.5 text-xs">
              <div className="flex justify-between text-[#d2c4b4]">
                <span>Dishes Subtotal</span>
                <span>₹{cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#d2c4b4]">
                <span>GST / Taxes (5%)</span>
                <span>₹{cart.tax.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-[#4f4539]/30 flex justify-between font-serif-heading text-base font-bold text-[#e3e2e2]">
                <span>Total Payable</span>
                <span className="text-[#edbf7b]">₹{cart.total.toFixed(2)}</span>
              </div>
            </div>

            {orderError && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{orderError}</span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Sticky Bottom Checkout Bar */}
      {cart.items.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-[#121414]/95 backdrop-blur-xl border-t border-[#4f4539]/30 z-30">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#d2c4b4]/60">Total Bill</p>
              <p className="font-serif-heading text-xl font-bold text-[#edbf7b]">
                ₹{cart.total.toFixed(2)}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-1 justify-end">
              <Link
                to={`${baseRoute}/menu`}
                className="px-3.5 h-12 rounded-xl bg-[#1f2020] border border-[#4f4539]/40 text-[#d2c4b4] hover:text-[#edbf7b] font-bold text-xs uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span className="hidden sm:inline">Add Dishes</span>
              </Link>

              <button
                onClick={handleInitiateCheckout}
                disabled={hasUnavailableItems}
                className={`flex-1 sm:flex-initial px-6 h-12 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200 shadow-xl flex items-center justify-center gap-2 ${
                  hasUnavailableItems
                    ? 'bg-rose-950/70 border border-rose-500/40 text-rose-300 cursor-not-allowed'
                    : 'bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] active:scale-98'
                }`}
              >
                {hasUnavailableItems ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">block</span>
                    <span>Remove Unavailable Items</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Pay</span>
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated / Digital Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#1f2020] rounded-t-3xl sm:rounded-3xl border border-[#edbf7b]/40 p-6 space-y-5 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-[#4f4539]/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#edbf7b] text-[22px]">lock</span>
                <h3 className="font-serif-heading text-lg font-bold text-[#e3e2e2]">
                  Instant Digital Payment
                </h3>
              </div>
              {!paymentProcessing && !paymentSuccess && (
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="text-[#9b8f80] hover:text-[#e3e2e2]"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>

            {/* Total Display */}
            <div className="p-4 rounded-2xl bg-[#121414] border border-[#4f4539]/30 text-center space-y-1">
              <p className="text-[10px] uppercase font-bold text-[#d2c4b4]/60 tracking-wider">
                Paying to Aurelian Restaurant (Table {table?.tableNumber || 1})
              </p>
              <p className="font-serif-heading text-3xl font-extrabold text-[#edbf7b]">
                ₹{cart.total.toFixed(2)}
              </p>
            </div>

            {paymentProcessing ? (
              <div className="py-8 text-center space-y-3">
                {paymentSuccess ? (
                  <div className="space-y-2">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center text-emerald-400 animate-bounce">
                      <span className="material-symbols-outlined text-[36px]">verified</span>
                    </div>
                    <p className="font-serif-heading font-bold text-lg text-emerald-400">
                      Payment Successful!
                    </p>
                    <p className="text-xs text-[#d2c4b4]/70">Transmitting ticket to kitchen display...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-full border-3 border-[#edbf7b] border-t-transparent animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-[#edbf7b] uppercase tracking-wider">
                      Authorizing Instant Transaction...
                    </p>
                    <p className="text-[11px] text-[#d2c4b4]/50">Simulating bank gateway authorization</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  <label className="font-semibold text-[#d2c4b4]">Select Payment Method</label>
                  
                  {/* UPI */}
                  <div
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === 'upi'
                        ? 'bg-[#343535] border-[#edbf7b]'
                        : 'bg-[#121414] border-[#4f4539]/30 hover:border-[#4f4539]/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#edbf7b] text-[20px]">qr_code_2</span>
                      <div>
                        <p className="font-semibold text-[#e3e2e2]">UPI (Google Pay, PhonePe, Paytm)</p>
                        <p className="text-[10px] text-[#d2c4b4]/60">Instant 0-fee zero-contact payment</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'upi' ? 'border-[#edbf7b]' : 'border-[#9b8f80]'}`}>
                      {paymentMethod === 'upi' && <div className="w-2 h-2 rounded-full bg-[#edbf7b]" />}
                    </div>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="pt-1">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@bankupi"
                        className="w-full h-10 bg-[#121414] rounded-lg px-3 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                      />
                    </div>
                  )}

                  {/* Cards */}
                  <div
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-[#343535] border-[#edbf7b]'
                        : 'bg-[#121414] border-[#4f4539]/30 hover:border-[#4f4539]/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#edbf7b] text-[20px]">credit_card</span>
                      <div>
                        <p className="font-semibold text-[#e3e2e2]">Credit / Debit Card (Visa, RuPay)</p>
                        <p className="text-[10px] text-[#d2c4b4]/60">Encrypted card transaction</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'card' ? 'border-[#edbf7b]' : 'border-[#9b8f80]'}`}>
                      {paymentMethod === 'card' && <div className="w-2 h-2 rounded-full bg-[#edbf7b]" />}
                    </div>
                  </div>

                  {/* Cash at Counter */}
                  <div
                    onClick={() => setPaymentMethod('counter')}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === 'counter'
                        ? 'bg-[#343535] border-[#edbf7b]'
                        : 'bg-[#121414] border-[#4f4539]/30 hover:border-[#4f4539]/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#edbf7b] text-[20px]">storefront</span>
                      <div>
                        <p className="font-semibold text-[#e3e2e2]">Pay at Counter / Cash</p>
                        <p className="text-[10px] text-[#d2c4b4]/60">Settle bill directly with your server</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'counter' ? 'border-[#edbf7b]' : 'border-[#9b8f80]'}`}>
                      {paymentMethod === 'counter' && <div className="w-2 h-2 rounded-full bg-[#edbf7b]" />}
                    </div>
                  </div>
                </div>

                {/* Modal Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleProcessPayment}
                    className="w-full h-12 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-widest transition-all duration-200 shadow-xl flex items-center justify-center gap-2 active:scale-98"
                  >
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    <span>Confirm & Pay ₹{cart.total.toFixed(2)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPaymentModalOpen(false);
                      navigate(`${baseRoute}/menu`);
                    }}
                    className="w-full h-10 rounded-xl bg-[#121414] hover:bg-[#343535] border border-[#4f4539]/30 text-[#d2c4b4] hover:text-[#e3e2e2] font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Add More Dishes First</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {activeReceiptOrder && (
        <DigitalReceipt
          order={activeReceiptOrder as any}
          onClose={() => setActiveReceiptOrder(null)}
          isAdmin={false}
        />
      )}

      <CustomerBottomNav />
    </div>
  );
};
