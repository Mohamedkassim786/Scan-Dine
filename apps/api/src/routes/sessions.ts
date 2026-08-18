import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { logAudit } from '../utils/audit';

const router = Router();

// GET /api/sessions/status/:sessionToken - Get session payment and bill status
router.get('/status/:sessionToken', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionToken = req.params.sessionToken as string;

    const session = await prisma.customerSession.findUnique({
      where: { sessionToken },
      include: {
        table: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            address: true,
            phone: true,
            taxPercentage: true,
            serviceChargePercentage: true,
          },
        },
        orders: {
          where: { status: { not: 'cancelled' } },
          include: {
            items: { include: { menuItem: true } },
            payments: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found', isActive: false });
    }

    if (!session.isActive) {
      return res.json({
        isActive: false,
        message: 'This dining session has already ended.',
      });
    }

    const orders = session.orders;
    if (orders.length === 0) {
      return res.json({
        isActive: true,
        hasOrders: false,
        totalAmount: 0,
        subtotalAmount: 0,
        taxAmount: 0,
        serviceChargeAmount: 0,
        paymentStatus: 'paid',
        paymentMethod: 'none',
        items: [],
        tableNumber: session.table.tableNumber,
        restaurant: session.restaurant,
      });
    }

    // Consolidated calculations
    let subtotalAmount = 0;
    let allPaid = true;
    let paymentMethod = orders[0].paymentMethod || 'cash';
    let transactionId = '';

    const consolidatedItemsMap = new Map<string, { id: string; quantity: number; priceAtOrder: number; menuItem: any }>();
    const orderNumbers: string[] = [];

    orders.forEach((ord) => {
      orderNumbers.push(ord.orderNumber);
      if (ord.paymentStatus !== 'paid') {
        allPaid = false;
      }
      if (ord.paymentMethod) {
        paymentMethod = ord.paymentMethod;
      }

      const p = ord.payments?.[0];
      if (p?.transactionId) {
        transactionId = p.transactionId;
      }

      ord.items.forEach((item) => {
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

    const taxPercentage = session.restaurant.taxPercentage || 5.0;
    const taxAmount = Math.round(subtotalAmount * (taxPercentage / 100) * 100) / 100;
    const serviceChargePercentage = session.restaurant.serviceChargePercentage || 0.0;
    const serviceChargeAmount = Math.round(subtotalAmount * (serviceChargePercentage / 100) * 100) / 100;
    const totalAmount = Math.round((subtotalAmount + taxAmount + serviceChargeAmount) * 100) / 100;

    return res.json({
      isActive: true,
      hasOrders: true,
      orderNumber: orderNumbers.join(', #'),
      createdAt: orders[0].createdAt,
      subtotalAmount,
      taxAmount,
      serviceChargeAmount,
      totalAmount,
      paymentMethod,
      paymentStatus: allPaid ? 'paid' : 'pending',
      status: (session as any).status || 'active',
      cashierPassCode: (session as any).cashierPassCode || null,
      transactionId: transactionId || (paymentMethod === 'cash' ? 'CASH-COUNTER' : `ONLINE-T${session.table.tableNumber}`),
      tableNumber: session.table.tableNumber,
      restaurant: session.restaurant,
      items: Array.from(consolidatedItemsMap.values()),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/freeze-for-cash - Customer selected Pay Cash at Counter
router.post('/freeze-for-cash', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionToken } = req.body;
    if (!sessionToken) {
      return res.status(400).json({ error: 'Session token required' });
    }

    const session = await prisma.customerSession.findUnique({
      where: { sessionToken },
      include: {
        table: true,
        restaurant: true,
        orders: {
          where: { status: { not: 'cancelled' } },
          include: { items: { include: { menuItem: true } } },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Calculate total amount
    let subtotalAmount = 0;
    session.orders.forEach((order) => {
      order.items.forEach((item) => {
        subtotalAmount += item.priceAtOrder * item.quantity;
      });
    });

    const taxAmount = (subtotalAmount * (session.restaurant.taxPercentage || 5.0)) / 100;
    const serviceChargeAmount = (subtotalAmount * (session.restaurant.serviceChargePercentage || 0.0)) / 100;
    const totalAmount = subtotalAmount + taxAmount + serviceChargeAmount;

    // Generate Cashier Pass Code if not present (e.g. A7F3)
    const cashierPassCode = (session as any).cashierPassCode || `A${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Freeze session (no more orders allowed, but session stays open for cashier verification)
    await prisma.customerSession.update({
      where: { id: session.id },
      data: {
        status: 'frozen',
        cashierPassCode,
      } as any,
    });

    // 2. Immediately regenerate table QR token so Table is FREE for next customer (ESP32 displays new QR)
    const newToken = `tbl-token-${uuidv4()}`;
    const baseUrl = process.env.QR_BASE_URL || 'http://192.168.1.4:5173';
    const qrUrl = `${baseUrl}/r/${session.restaurant.slug}/t/${newToken}`;

    let qrCodeUrl = '';
    try {
      qrCodeUrl = await QRCode.toDataURL(qrUrl, {
        width: 512,
        margin: 2,
        color: { dark: '#121414', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      });
    } catch (e) {
      console.error('Failed to generate new table QR data URL on freeze-for-cash:', e);
    }

    // 3. Update table to available with new QR token
    await prisma.restaurantTable.update({
      where: { id: session.tableId },
      data: {
        status: 'available',
        qrToken: newToken,
        qrCodeUrl: qrCodeUrl || undefined,
      },
    });

    // Audit log
    await logAudit({
      action: 'SESSION_FREEZE_CASH',
      entity: 'CustomerSession',
      entityId: session.id,
      details: `Customer selected Cash at Counter for Table ${session.table.tableNumber}. Cashier Pass #${cashierPassCode}. Table freed with new QR.`,
      restaurantId: session.restaurantId,
    });

    // Emit Socket.IO events for real-time ESP32, Admin, and Staff updates
    const io = req.app.get('io');
    if (io) {
      const payload = {
        tableId: session.tableId,
        tableNumber: session.table.tableNumber,
        sessionId: session.id,
        qrToken: newToken,
        qrCodeUrl,
        cashierPassCode,
        totalAmount,
      };

      io.to(`restaurant-${session.restaurantId}`).emit('table-updated', payload);
      io.to(`restaurant-${session.restaurantId}`).emit('qr-updated', payload);
      io.to(`restaurant-${session.restaurantId}`).emit('cash-pass-created', payload);
      io.to(`session-${session.id}`).emit('session-frozen', payload);
      io.emit('table-updated', payload);
      io.emit('qr-updated', payload);
    }

    return res.json({
      success: true,
      cashierPassCode,
      totalAmount,
      sessionId: session.id,
      message: 'Cashier pass created. Please pay cash at counter.',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/close - Finish dining and close session
router.post('/close', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionToken } = req.body;
    if (!sessionToken) {
      return res.status(400).json({ error: 'Session token required' });
    }

    const session = await prisma.customerSession.findUnique({
      where: { sessionToken },
      include: { table: true, restaurant: true },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 1. Mark session inactive and closed
    await prisma.customerSession.update({
      where: { id: session.id },
      data: { isActive: false, status: 'closed' } as any,
    });

    // 2. Regenerate table QR token if not already regenerated
    const newToken = `tbl-token-${uuidv4()}`;
    const baseUrl = process.env.QR_BASE_URL || 'http://192.168.1.4:5173';
    const qrUrl = `${baseUrl}/r/${session.restaurant.slug}/t/${newToken}`;

    let qrCodeUrl = '';
    try {
      qrCodeUrl = await QRCode.toDataURL(qrUrl, {
        width: 512,
        margin: 2,
        color: { dark: '#121414', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      });
    } catch (e) {
      console.error('Failed to generate new table QR data URL on session close:', e);
    }

    // Update table to available with new QR token
    await prisma.restaurantTable.update({
      where: { id: session.tableId },
      data: {
        status: 'available',
        qrToken: newToken,
        qrCodeUrl: qrCodeUrl || undefined,
      },
    });

    // Audit log
    await logAudit({
      action: 'SESSION_FINISHED',
      entity: 'CustomerSession',
      entityId: session.id,
      details: `Dining session closed for Table ${session.table.tableNumber}. Generated new table QR.`,
      restaurantId: session.restaurantId,
    });

    // Emit Socket.IO events for real-time admin, staff, and ESP32 updates
    const io = req.app.get('io');
    if (io) {
      const payload = {
        tableId: session.tableId,
        tableNumber: session.table.tableNumber,
        sessionId: session.id,
        qrToken: newToken,
        qrCodeUrl,
      };

      io.to(`restaurant-${session.restaurantId}`).emit('session-closed', payload);
      io.to(`restaurant-${session.restaurantId}`).emit('table-updated', payload);
      io.to(`restaurant-${session.restaurantId}`).emit('qr-updated', payload);
      io.to(`session-${session.id}`).emit('session-closed', payload);
      io.emit('session-closed', payload);
      io.emit('table-updated', payload);
      io.emit('qr-updated', payload);
    }

    return res.json({
      success: true,
      message: 'Thank you for dining with us!',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
