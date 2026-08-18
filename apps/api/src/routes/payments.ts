import { Router, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const router = Router();

// GET /api/payments?restaurantId=xxx (admin)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req.query.restaurantId as string) || req.user?.restaurantId;
    const { status, method, startDate, endDate } = req.query;

    const where: any = { ...(restaurantId ? { restaurantId } : {}) };
    if (status && status !== 'all') where.status = status as string;
    if (method && method !== 'all') where.method = method as string;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            table: { select: { tableNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute Metrics
    const allRestaurantPayments = await prisma.payment.findMany({
      where: { ...(restaurantId ? { restaurantId } : {}) },
    });

    const totalRevenue = allRestaurantPayments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const onlinePayments = allRestaurantPayments
      .filter((p) => p.method === 'online' && p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const cashPayments = allRestaurantPayments
      .filter((p) => p.method === 'cash' && p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const cashPending = allRestaurantPayments
      .filter((p) => p.method === 'cash' && p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    const failedPayments = allRestaurantPayments.filter((p) => p.status === 'failed').length;
    const refunds = allRestaurantPayments.filter((p) => p.status === 'refunded').length;

    return res.json({
      payments,
      summary: {
        totalRevenue,
        onlinePayments,
        cashPayments,
        cashPending,
        failedPayments,
        refunds,
      },
    });
  } catch (error) { next(error); }
});

// PATCH /api/payments/:id/status (admin)
router.patch('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status, notes } = req.body;
    const validStatuses = ['pending', 'processing', 'paid', 'failed', 'refunded'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        notes: notes !== undefined ? notes : undefined,
        paidAt: status === 'paid' ? new Date() : undefined,
      },
      include: { order: true },
    });

    // Sync order payment status & close session if paid
    if (payment.orderId) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: status },
      });

      if (status === 'paid' && payment.order?.sessionId) {
        await prisma.customerSession.update({
          where: { id: payment.order.sessionId },
          data: { isActive: false, status: 'closed' },
        });
      }
    }

    if (req.user?.restaurantId) {
      await logAudit({
        action: 'PAYMENT_STATUS_UPDATED',
        entity: 'Payment',
        entityId: payment.id,
        details: `Updated payment status to ${status.toUpperCase()} for Order #${payment.order.orderNumber}`,
        userId: req.user.id,
        userName: req.user.name,
        restaurantId: req.user.restaurantId,
      });
    }

    // Emit Socket.IO events for real-time customer update
    const io = req.app.get('io');
    if (io) {
      if (payment.orderId && payment.order) {
        io.to(`order-${payment.orderId}`).emit('payment-updated', { paymentId: payment.id, status, orderId: payment.orderId, sessionId: payment.order.sessionId });
        if (payment.order.sessionId) {
          io.to(`session-${payment.order.sessionId}`).emit('payment-updated', { paymentId: payment.id, status, orderId: payment.orderId, sessionId: payment.order.sessionId });
        }
        io.to(`order-${payment.orderId}`).emit('order-status-update', { orderId: payment.orderId, status: payment.order.status, order: payment.order });
      }
      const rId = req.user?.restaurantId || payment.restaurantId;
      if (rId) {
        io.to(`restaurant-${rId}`).emit('payment-updated', { paymentId: payment.id, status });
      }
    }

    return res.json(payment);
  } catch (error) { next(error); }
});

export default router;
