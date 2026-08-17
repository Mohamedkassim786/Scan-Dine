import { Router, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications?restaurantId=xxx (admin)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req.query.restaurantId as string) || req.user?.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: 'Restaurant ID required' });

    const notifications = await prisma.notification.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { restaurantId, isRead: false },
    });

    return res.json({ notifications, unreadCount });
  } catch (error) { next(error); }
});

// PATCH /api/notifications/:id/read (admin)
router.patch('/:id/read', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return res.json(notification);
  } catch (error) { next(error); }
});

// POST /api/notifications/mark-all-read (admin)
router.post('/mark-all-read', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req.body.restaurantId as string) || req.user?.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: 'Restaurant ID required' });

    await prisma.notification.updateMany({
      where: { restaurantId, isRead: false },
      data: { isRead: true },
    });
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) { next(error); }
});

// DELETE /api/notifications/clear (admin)
router.delete('/clear', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req.query.restaurantId as string) || req.user?.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: 'Restaurant ID required' });

    await prisma.notification.deleteMany({ where: { restaurantId } });
    return res.json({ message: 'All notifications cleared' });
  } catch (error) { next(error); }
});

export default router;
