import { Router, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/reports/sales?type=daily|monthly (admin)
router.get('/sales', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req.query.restaurantId as string) || req.user?.restaurantId || undefined;
    const { startDate, endDate } = req.query;

    const where: any = {
      status: { not: 'cancelled' },
      ...(restaurantId ? { restaurantId } : {}),
    };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: { select: { tableNumber: true } },
        items: { include: { menuItem: { select: { name: true, price: true } } } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
    const totalTax = orders.reduce((sum: number, o: any) => sum + o.taxAmount, 0);
    const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

    return res.json({
      totalOrders: orders.length,
      totalRevenue,
      totalTax,
      averageTicket,
      orders: orders.map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        tableNumber: o.table?.tableNumber || 1,
        totalAmount: o.totalAmount,
        taxAmount: o.taxAmount,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        itemCount: o.items.reduce((s: number, i: any) => s + i.quantity, 0),
        dishes: o.items.map((i: any) => `${i.quantity}x ${i.menuItem.name}`).join(', '),
        createdAt: o.createdAt,
      })),
    });
  } catch (error) { next(error); }
});

// GET /api/reports/menu (admin)
router.get('/menu', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req.query.restaurantId as string) || req.user?.restaurantId || undefined;

    const menuItems = await prisma.menuItem.findMany({
      where: { ...(restaurantId ? { restaurantId } : {}) },
      include: {
        category: true,
        orderItems: { select: { quantity: true, priceAtOrder: true } },
      },
    });

    const report = menuItems.map((item: any) => {
      const unitsSold = (item.orderItems || []).reduce((sum: number, oi: any) => sum + oi.quantity, 0);
      const grossRevenue = (item.orderItems || []).reduce((sum: number, oi: any) => sum + oi.quantity * oi.priceAtOrder, 0);

      return {
        id: item.id,
        name: item.name,
        category: item.category?.name || 'General',
        price: item.price,
        dietaryType: item.dietaryType,
        isAvailable: item.isAvailable,
        unitsSold,
        grossRevenue,
      };
    }).sort((a: any, b: any) => b.grossRevenue - a.grossRevenue);

    return res.json(report);
  } catch (error) { next(error); }
});

// GET /api/reports/tables (admin)
router.get('/tables', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req.query.restaurantId as string) || req.user?.restaurantId || undefined;

    const tables = await prisma.restaurantTable.findMany({
      where: {
        isDeleted: false,
        ...(restaurantId ? { restaurantId } : {}),
      },
      include: {
        orders: {
          where: { status: { not: 'cancelled' } },
          select: { id: true, totalAmount: true, createdAt: true },
        },
      },
      orderBy: { tableNumber: 'asc' },
    });

    const report = tables.map((t: any) => {
      const orders = t.orders || [];
      const totalRevenue = orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
      return {
        tableNumber: t.tableNumber,
        capacity: t.capacity,
        status: t.status,
        totalOrders: orders.length,
        totalRevenue,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      };
    });

    return res.json(report);
  } catch (error) { next(error); }
});

export default router;
