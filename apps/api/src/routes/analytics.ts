import { Router, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/analytics/dashboard?restaurantId=xxx (admin)
router.get('/dashboard', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req.query.restaurantId as string) || req.user?.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: 'Restaurant ID required' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's orders
    const todaysOrders = await prisma.order.count({
      where: { restaurantId, createdAt: { gte: today } },
    });

    // Today's revenue
    const revenueResult = await prisma.order.aggregate({
      where: { restaurantId, createdAt: { gte: today }, status: { not: 'cancelled' } },
      _sum: { totalAmount: true },
    });
    const todaysRevenue = revenueResult._sum.totalAmount || 0;

    // Active tables
    const activeTables = await prisma.restaurantTable.count({
      where: { restaurantId, isActive: true },
    });
    const occupiedTables = await prisma.restaurantTable.count({
      where: { restaurantId, status: 'occupied' },
    });

    // Pending orders
    const pendingOrders = await prisma.order.count({
      where: { restaurantId, status: { in: ['new', 'accepted', 'preparing'] } },
    });

    // Popular dishes (top 5)
    const orderItems = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: { order: { restaurantId } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const popularDishes = await Promise.all(
      orderItems.map(async (item: { menuItemId: string; _sum: { quantity: number | null } }) => {
        const menuItem = await prisma.menuItem.findUnique({
          where: { id: item.menuItemId },
          select: { id: true, name: true, imageUrl: true, price: true },
        });
        return { ...menuItem, totalOrdered: item._sum.quantity || 0 };
      })
    );

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      where: { restaurantId },
      include: {
        items: { include: { menuItem: { select: { name: true } } } },
        table: { select: { tableNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return res.json({
      todaysOrders,
      todaysRevenue,
      activeTables,
      occupiedTables,
      pendingOrders,
      popularDishes,
      recentOrders,
    });
  } catch (error) { next(error); }
});

export default router;
