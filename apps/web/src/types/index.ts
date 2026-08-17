export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  cuisine: string;
  description: string;
  logoUrl: string;
  coverUrl: string;
  address: string;
  phone: string;
  email?: string;
  currency?: string;
  taxPercentage?: number;
  serviceChargePercentage?: number;
  isOpen?: boolean;
  isTemporarilyClosed?: boolean;
  temporaryClosureReason?: string;
  openTime: string;
  closeTime: string;
  weeklySchedule?: string;
  isActive: boolean;
}

export interface RestaurantTable {
  id: string;
  tableNumber: number;
  capacity: number;
  status: 'available' | 'occupied' | 'ordering' | 'payment_pending' | 'cleaning' | 'disabled';
  qrToken: string;
  qrCodeUrl: string;
  isActive: boolean;
  isDeleted?: boolean;
  restaurantId: string;
}

export type Table = RestaurantTable;

export interface CustomerSession {
  id: string;
  token: string;
  restaurantId: string;
  tableId: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  restaurantId: string;
  _count?: {
    menuItems: number;
  };
}

export interface AddonOption {
  id: string;
  addonGroupId: string;
  name: string;
  price: number;
  isAvailable: boolean;
  displayOrder: number;
}

export interface AddonGroup {
  id: string;
  name: string;
  description: string;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  displayOrder: number;
  menuItemId: string;
  menuItem?: {
    id: string;
    name: string;
    price: number;
  };
  options: AddonOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  spiceLevel: 'none' | 'mild' | 'medium' | 'hot' | 'extra-hot';
  prepTime: number;
  calories: number;
  dietaryType: 'veg' | 'non-veg' | 'vegan' | 'egg';
  isAvailable: boolean;
  isPopular: boolean;
  isChefPick: boolean;
  isFeatured?: boolean;
  ingredients: string;
  allergens: string;
  nutrition: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  addonGroups?: AddonGroup[];
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  specialInstructions: string;
  itemTotal: number;
}

export interface Cart {
  id?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface OrderItem {
  id: string;
  quantity: number;
  priceAtOrder: number;
  specialInstructions: string;
  menuItemId: string;
  menuItem: {
    id: string;
    name: string;
    imageUrl: string;
    price?: number;
  };
}

export interface OrderStatusHistory {
  id: string;
  status: string;
  note: string;
  changedBy: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'new' | 'accepted' | 'preparing' | 'ready' | 'served' | 'cancelled';
  paymentStatus?: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'cash' | 'online';
  totalAmount: number;
  taxAmount: number;
  specialInstructions: string;
  restaurantId: string;
  tableId: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  table?: {
    tableNumber: number;
  };
  restaurant?: {
    name: string;
    logoUrl: string;
  };
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'chef' | 'staff';
  phone?: string;
  avatarUrl?: string;
  permissions?: string;
  restaurantId?: string;
  isActive?: boolean;
  createdAt?: string;
}

export type Chef = User;
export type Staff = User;

export interface Payment {
  id: string;
  amount: number;
  method: 'cash' | 'online';
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
  transactionId?: string;
  gatewayResponse?: string;
  notes?: string;
  paidAt?: string;
  orderId: string;
  order?: Order;
  restaurantId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  data?: string;
  restaurantId: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  details: string;
  metadata?: string;
  ipAddress?: string;
  userId?: string;
  userName?: string;
  restaurantId: string;
  createdAt: string;
}

export interface DashboardStats {
  todaysOrders: number;
  todaysRevenue: number;
  activeTables: number;
  occupiedTables: number;
  pendingOrders: number;
  popularDishes: {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
    totalOrdered: number;
  }[];
  recentOrders: Order[];
}
