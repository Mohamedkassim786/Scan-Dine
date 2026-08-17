import { create } from 'zustand';
import api from '../services/api';
import { Restaurant, RestaurantTable, CustomerSession, Cart, MenuItem } from '../types';

interface CustomerState {
  restaurant: Restaurant | null;
  table: Partial<RestaurantTable> | null;
  session: CustomerSession | null;
  cart: Cart;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initSessionFromQR: (token: string) => Promise<boolean>;
  fetchCart: () => Promise<void>;
  addToCart: (menuItemId: string, quantity?: number, specialInstructions?: string) => Promise<void>;
  updateCartItem: (menuItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (menuItemId: string) => Promise<void>;
  clearCart: () => void;
  placeOrder: (specialInstructions?: string, paymentMethod?: string, transactionId?: string) => Promise<any>;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  restaurant: null,
  table: null,
  session: null,
  cart: { items: [], subtotal: 0, tax: 0, total: 0 },
  isLoading: false,
  error: null,

  initSessionFromQR: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/qr/${token}`);
      const { restaurant, table, session } = response.data;
      
      set({
        restaurant,
        table,
        session,
        isLoading: false,
      });

      // Save token locally for session persistence
      localStorage.setItem(`scan_dine_session_${restaurant.slug}`, JSON.stringify({ token: session.token, tableNumber: table.tableNumber }));
      
      // Load current cart
      await get().fetchCart();
      return true;
    } catch (err: any) {
      console.error('QR Validation error:', err);
      set({
        error: err.response?.data?.error || 'Invalid or inactive QR code.',
        isLoading: false,
      });
      return false;
    }
  },

  fetchCart: async () => {
    const { session } = get();
    if (!session?.token) return;

    try {
      const response = await api.get(`/cart?sessionToken=${session.token}`);
      set({ cart: response.data });
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  },

  addToCart: async (menuItemId: string, quantity = 1, specialInstructions = '') => {
    const { session } = get();
    if (!session?.token) return;

    try {
      await api.post('/cart/add', {
        sessionToken: session.token,
        menuItemId,
        quantity,
        specialInstructions,
      });
      await get().fetchCart();
    } catch (err) {
      console.error('Error adding to cart:', err);
      throw err;
    }
  },

  updateCartItem: async (menuItemId: string, quantity: number) => {
    const { session } = get();
    if (!session?.token) return;

    try {
      await api.put('/cart/update', {
        sessionToken: session.token,
        menuItemId,
        quantity,
      });
      await get().fetchCart();
    } catch (err) {
      console.error('Error updating cart:', err);
    }
  },

  removeFromCart: async (menuItemId: string) => {
    const { session } = get();
    if (!session?.token) return;

    try {
      await api.delete('/cart/remove', {
        data: {
          sessionToken: session.token,
          menuItemId,
        },
      });
      await get().fetchCart();
    } catch (err) {
      console.error('Error removing item from cart:', err);
    }
  },

  clearCart: () => {
    set({ cart: { items: [], subtotal: 0, tax: 0, total: 0 } });
  },

  placeOrder: async (specialInstructions = '', paymentMethod = 'online', transactionId = '') => {
    const { session } = get();
    if (!session?.token) throw new Error('No active dining session');

    try {
      const response = await api.post('/orders', {
        sessionToken: session.token,
        specialInstructions,
        paymentMethod,
        transactionId,
        isPaidOnline: paymentMethod !== 'counter' && paymentMethod !== 'cash',
      });
      get().clearCart();
      return response.data;
    } catch (err: any) {
      console.error('Error placing order:', err);
      throw err;
    }
  },
}));
