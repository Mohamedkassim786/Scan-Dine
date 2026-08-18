import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, requireChef, AuthRequest } from '../middleware/auth';
import { emitNewOrder, emitOrderStatusUpdate } from '../socket';
import { logAudit } from '../utils/audit';

const router = Router();

// Helper to generate order number
function generateOrderNumber(): string {
  const prefix = 'A';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

// POST /api/orders - Place order (customer, no auth)
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionToken, specialInstructions, paymentMethod, isPaidOnline, transactionId } = req.body;
    if (!sessionToken) return res.status(400).json({ error: 'Session token required' });

    const session = await prisma.customerSession.findUnique({
      where: { sessionToken },
      include: { table: true },
    });
    if (!session) return res.status(404).json({ error: 'Invalid session' });
    if (!session.isActive || (session as any).status === 'frozen' || (session as any).status === 'closed') {
      return res.status(400).json({ error: 'Your dining session has been closed for payment. No more orders can be placed.' });
    }
    if (!session.table.isActive || session.table.isDeleted) {
      return res.status(400).json({ error: 'Table is no longer active' });
    }

    // Get cart
    const cart = await prisma.cart.findUnique({
      where: { sessionId: session.id },
      include: { items: { include: { menuItem: true } } },
    });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Backend validation of every cart item against latest DB state
    const validatedItems: Array<{ menuItemId: string; name: string; price: number; quantity: number; specialInstructions: string }> = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const latestItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });

      if (!latestItem || !latestItem.isAvailable || latestItem.restaurantId !== session.restaurantId) {
        // Remove unavailable item from cart
        await prisma.cartItem.delete({ where: { id: item.id } });
        const dishName = latestItem?.name || 'An item in your cart';
        return res.status(400).json({
          error: `${dishName} is currently unavailable and has been removed from your order.`,
          unavailableItem: dishName,
        });
      }

      subtotal += latestItem.price * item.quantity;
      validatedItems.push({
        menuItemId: latestItem.id,
        name: latestItem.name,
        price: latestItem.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || '',
      });
    }

    // Calculate totals from DB prices
    const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    const rawMethod = (paymentMethod || 'cash').toLowerCase();
    const isOnline = ['upi', 'card', 'online', 'netbanking'].includes(rawMethod);
    const method = isOnline ? rawMethod : 'cash';
    const paymentStatus = isPaidOnline !== undefined ? (isPaidOnline ? 'paid' : 'pending') : (isOnline ? 'paid' : 'pending');
    const autoTxnId = transactionId || (isOnline ? `${rawMethod.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}` : 'CASH-COUNTER');

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        status: 'new',
        paymentMethod: method,
        paymentStatus,
        subtotalAmount: subtotal,
        taxAmount,
        totalAmount,
        specialInstructions: specialInstructions || '',
        restaurantId: session.restaurantId,
        tableId: session.tableId,
        sessionId: session.id,
        items: {
          create: cart.items.map((item: any) => ({
            quantity: item.quantity,
            priceAtOrder: item.menuItem.price,
            specialInstructions: item.specialInstructions || '',
            menuItemId: item.menuItemId,
          })),
        },
        statusHistory: {
          create: { status: 'new', changedBy: 'Customer (Dine-in)' },
        },
        payments: {
          create: {
            amount: totalAmount,
            method,
            provider: isOnline ? rawMethod : 'cash',
            status: paymentStatus,
            transactionId: autoTxnId,
            paidAt: paymentStatus === 'paid' ? new Date() : undefined,
            restaurantId: session.restaurantId,
          },
        },
      },
      include: {
        items: { include: { menuItem: { select: { id: true, name: true, imageUrl: true, price: true } } } },
        table: { select: { tableNumber: true } },
        restaurant: { select: { name: true, logoUrl: true, address: true, phone: true } },
        payments: true,
      },
    });

    // Update table status to occupied
    await prisma.restaurantTable.update({
      where: { id: session.tableId },
      data: { status: 'occupied' },
    });

    // Clear cart after order
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    // Create persistent Notification for Admin & Staff
    await prisma.notification.create({
      data: {
        type: 'new_order',
        title: `New Dining Order #${order.orderNumber}`,
        message: `Table ${order.table?.tableNumber || 1} placed order for ₹${order.totalAmount.toFixed(2)} (${order.items.length} dishes)`,
        restaurantId: session.restaurantId,
        metadata: JSON.stringify({ orderId: order.id, tableId: session.tableId }),
      },
    });

    // Log Analytics Event
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'order_placed',
        sessionId: session.id,
        restaurantId: session.restaurantId,
        metadata: JSON.stringify({
          orderId: order.id,
          amount: order.totalAmount,
          itemCount: order.items.length,
          paymentMethod: method,
        }),
      },
    });

    // Emit to kitchen and admin
    const io = req.app.get('io');
    if (io) {
      emitNewOrder(io, session.restaurantId, order);
    }

    return res.status(201).json(order);
  } catch (error) { next(error); }
});

// GET /api/orders?sessionToken=xxx or qrToken=xxx (customer)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionToken, qrToken, tableToken, restaurantId, status } = req.query;

    let where: any = {};
    const tokenStr = (sessionToken || qrToken || tableToken) as string;

    if (tokenStr) {
      const session = await prisma.customerSession.findUnique({ where: { sessionToken: tokenStr } });
      if (session) {
        where.sessionId = session.id;
      } else {
        const table = await prisma.restaurantTable.findUnique({ where: { qrToken: tokenStr } });
        if (table) {
          // Find current active session on this table
          const activeSession = await prisma.customerSession.findFirst({
            where: { tableId: table.id, isActive: true },
            orderBy: { createdAt: 'desc' },
          });
          if (activeSession) {
            where.sessionId = activeSession.id;
          } else {
            return res.json([]);
          }
        } else {
          return res.status(404).json({ error: 'Invalid session or table token' });
        }
      }
    } else if (restaurantId) {
      where.restaurantId = restaurantId as string;
    }

    if (status && status !== 'all') {
      where.status = status as string;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: { include: { menuItem: { select: { id: true, name: true, imageUrl: true, price: true } } } },
        table: { select: { tableNumber: true } },
        restaurant: { select: { name: true, logoUrl: true, address: true, phone: true } },
        payments: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(orders);
  } catch (error) { next(error); }
});

// GET /api/orders/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { menuItem: { select: { id: true, name: true, imageUrl: true, price: true } } } },
        table: { select: { tableNumber: true } },
        restaurant: { select: { name: true, logoUrl: true, address: true, phone: true, taxPercentage: true, serviceChargePercentage: true } },
        payments: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.json(order);
  } catch (error) { next(error); }
});

// PATCH /api/orders/:id/status (chef/admin)
router.patch('/:id/status', authenticate, requireChef, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const validStatuses = ['accepted', 'preparing', 'ready', 'served', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        statusHistory: {
          create: { status, changedBy: req.user?.name || req.user?.role || 'Kitchen Staff' },
        },
      },
      include: {
        items: { include: { menuItem: { select: { id: true, name: true, imageUrl: true } } } },
        table: { select: { tableNumber: true } },
        restaurant: { select: { name: true, logoUrl: true, address: true, phone: true } },
        payments: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    // If order served, set table status to available or payment_pending
    if (status === 'served') {
      if (order.paymentStatus === 'paid') {
        await prisma.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: 'available' },
        });
      } else {
        await prisma.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: 'payment_pending' },
        });
      }
    }

    // Emit status update to customer & kitchen
    const io = req.app.get('io');
    if (io) {
      emitOrderStatusUpdate(io, order.id, status, order);
      emitNewOrder(io, order.restaurantId, order);
    }

    return res.json(order);
  } catch (error) { next(error); }
});

// GET /api/orders/session-bill/:sessionToken (Consolidated Single Bill for Customer Session)
router.get('/session-bill/:sessionToken', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokenParam = req.params.sessionToken as string;
    let ordersList: any[] = [];
    let restaurantInfo: any = null;
    let tableNumber = 1;
    let sessionRecordId = '';

    // Check if sessionToken or table qrToken
    const session = await prisma.customerSession.findUnique({
      where: { sessionToken: tokenParam },
      include: {
        table: true,
        restaurant: true,
        orders: {
          include: {
            items: { include: { menuItem: true } },
            payments: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (session && session.orders.length > 0) {
      ordersList = session.orders;
      restaurantInfo = session.restaurant;
      tableNumber = session.table.tableNumber;
      sessionRecordId = session.id;
    } else {
      const table = await prisma.restaurantTable.findUnique({
        where: { qrToken: tokenParam },
        include: {
          restaurant: true,
          orders: {
            where: { createdAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) } },
            include: {
              items: { include: { menuItem: true } },
              payments: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (table && table.orders.length > 0) {
        ordersList = table.orders;
        restaurantInfo = table.restaurant;
        tableNumber = table.tableNumber;
        sessionRecordId = table.id;
      }
    }

    if (ordersList.length === 0 || !restaurantInfo) {
      return res.status(404).json({ error: 'No orders found for this session or table' });
    }

    // Merge all items from all orders into a single consolidated itemized list
    const consolidatedItemsMap = new Map<string, { id: string; quantity: number; priceAtOrder: number; menuItem: any }>();

    let subtotalAmount = 0;
    const orderNumbers: string[] = [];
    let allPaid = true;
    let paymentMethod = 'cash';
    let latestPaidAt: any = null;

    ordersList.forEach((ord: any) => {
      orderNumbers.push(ord.orderNumber);
      if (ord.paymentStatus !== 'paid') allPaid = false;
      if (ord.paymentMethod) paymentMethod = ord.paymentMethod;

      const p = ord.payments?.[0];
      if (p?.paidAt) latestPaidAt = p.paidAt;

      ord.items.forEach((item: any) => {
        const key = item.menuItemId;
        if (consolidatedItemsMap.has(key)) {
          const existing = consolidatedItemsMap.get(key)!;
          existing.quantity += item.quantity;
        } else {
          consolidatedItemsMap.set(key, {
            id: item.id,
            quantity: item.quantity,
            priceAtOrder: item.priceAtOrder,
            menuItem: {
              name: item.menuItem.name,
              price: item.priceAtOrder,
            },
          });
        }
        subtotalAmount += item.priceAtOrder * item.quantity;
      });
    });

    const taxPercentage = restaurantInfo.taxPercentage || 5.0;
    const taxAmount = Math.round(subtotalAmount * (taxPercentage / 100) * 100) / 100;
    const serviceChargePercentage = restaurantInfo.serviceChargePercentage || 0.0;
    const serviceChargeAmount = Math.round(subtotalAmount * (serviceChargePercentage / 100) * 100) / 100;
    const totalAmount = Math.round((subtotalAmount + taxAmount + serviceChargeAmount) * 100) / 100;

    const consolidatedReceipt = {
      id: `consolidated-${sessionRecordId}`,
      orderNumber: `${orderNumbers.join(', #')}`,
      isConsolidated: true,
      ticketCount: orderNumbers.length,
      createdAt: ordersList[0].createdAt.toISOString(),
      table: { tableNumber },
      restaurant: {
        name: restaurantInfo.name,
        logoUrl: restaurantInfo.logoUrl,
        address: restaurantInfo.address,
        phone: restaurantInfo.phone,
        taxPercentage,
        serviceChargePercentage,
      },
      items: Array.from(consolidatedItemsMap.values()),
      subtotalAmount,
      taxAmount,
      serviceChargeAmount,
      totalAmount,
      paymentMethod,
      paymentStatus: allPaid ? 'paid' : 'pending',
      payments: [
        {
          method: paymentMethod,
          status: allPaid ? 'paid' : 'pending',
          transactionId: paymentMethod === 'cash' ? 'CASH-COUNTER' : `ONLINE-${tableNumber}`,
          paidAt: latestPaidAt ? latestPaidAt.toISOString() : undefined,
        },
      ],
    };

    return res.json(consolidatedReceipt);
  } catch (error) { next(error); }
});

// GET /api/orders/table-bill/:tableId (Consolidated Bill for Admin Table Settle)
router.get('/table-bill/:tableId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tableId = req.params.tableId as string;
    const table = await prisma.restaurantTable.findUnique({
      where: { id: tableId },
      include: {
        restaurant: true,
        orders: {
          where: { status: { not: 'cancelled' } },
          include: {
            items: { include: { menuItem: true } },
            payments: true,
          },
          orderBy: { createdAt: 'asc' },
          take: 20,
        },
      },
    });

    if (!table || table.orders.length === 0) {
      return res.status(404).json({ error: 'No orders found for this table' });
    }

    const consolidatedItemsMap = new Map<string, { id: string; quantity: number; priceAtOrder: number; menuItem: any }>();
    let subtotalAmount = 0;
    const orderNumbers: string[] = [];
    let allPaid = true;
    let paymentMethod = 'cash';

    table.orders.forEach((ord: any) => {
      orderNumbers.push(ord.orderNumber);
      if (ord.paymentStatus !== 'paid') allPaid = false;
      if (ord.paymentMethod) paymentMethod = ord.paymentMethod;

      ord.items.forEach((item: any) => {
        const key = item.menuItemId;
        if (consolidatedItemsMap.has(key)) {
          const existing = consolidatedItemsMap.get(key)!;
          existing.quantity += item.quantity;
        } else {
          consolidatedItemsMap.set(key, {
            id: item.id,
            quantity: item.quantity,
            priceAtOrder: item.priceAtOrder,
            menuItem: {
              name: item.menuItem.name,
              price: item.priceAtOrder,
            },
          });
        }
        subtotalAmount += item.priceAtOrder * item.quantity;
      });
    });

    const taxPercentage = table.restaurant.taxPercentage || 5.0;
    const taxAmount = Math.round(subtotalAmount * (taxPercentage / 100) * 100) / 100;
    const totalAmount = Math.round((subtotalAmount + taxAmount) * 100) / 100;

    const consolidatedReceipt = {
      id: `table-bill-${table.id}`,
      orderNumber: `${orderNumbers.join(', #')}`,
      isConsolidated: true,
      ticketCount: orderNumbers.length,
      createdAt: table.orders[0].createdAt.toISOString(),
      table: { tableNumber: table.tableNumber },
      restaurant: {
        name: table.restaurant.name,
        logoUrl: table.restaurant.logoUrl,
        address: table.restaurant.address,
        phone: table.restaurant.phone,
        taxPercentage,
      },
      items: Array.from(consolidatedItemsMap.values()),
      subtotalAmount,
      taxAmount,
      totalAmount,
      paymentMethod,
      paymentStatus: allPaid ? 'paid' : 'pending',
      payments: [
        {
          method: paymentMethod,
          status: allPaid ? 'paid' : 'pending',
          transactionId: paymentMethod === 'cash' ? 'CASH-COUNTER' : `ONLINE-${table.tableNumber}`,
        },
      ],
    };

    return res.json(consolidatedReceipt);
  } catch (error) { next(error); }
});

// POST /api/orders/settle-table/:tableId (Admin Settle Whole Table Cash Bill)
router.post('/settle-table/:tableId', authenticate, requireChef, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tableId = req.params.tableId as string;

    const updatedOrders = await prisma.order.updateMany({
      where: { tableId, paymentStatus: 'pending' },
      data: { paymentStatus: 'paid' },
    });

    await prisma.payment.updateMany({
      where: { order: { tableId }, status: 'pending' },
      data: { status: 'paid', paidAt: new Date() },
    });

    await prisma.restaurantTable.update({
      where: { id: tableId },
      data: { status: 'available' },
    });

    await logAudit({
      action: 'TABLE_BILL_SETTLED',
      entity: 'RestaurantTable',
      entityId: tableId,
      details: `Settled complete table bill for all active orders (${updatedOrders.count} orders)`,
      userId: req.user?.id,
      userName: req.user?.name,
      restaurantId: req.user?.restaurantId || '',
    });

    const io = req.app.get('io');
    if (io && req.user?.restaurantId) {
      io.to(`kitchen-${req.user.restaurantId}`).emit('table-settled', { tableId });
      io.emit('table-settled', { tableId });
    }

    return res.json({ success: true, settledOrdersCount: updatedOrders.count });
  } catch (error) { next(error); }
});

export default router;
