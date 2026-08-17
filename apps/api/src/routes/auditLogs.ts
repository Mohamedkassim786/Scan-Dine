import { Router, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/audit-logs?restaurantId=xxx (admin)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req.query.restaurantId as string) || req.user?.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: 'Restaurant ID required' });

    const { entity, action, search } = req.query;

    const where: any = { restaurantId };
    if (entity && entity !== 'all') where.entity = entity as string;
    if (action && action !== 'all') where.action = action as string;
    if (search) {
      where.OR = [
        { details: { contains: search as string } },
        { userName: { contains: search as string } },
        { action: { contains: search as string } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json(logs);
  } catch (error) { next(error); }
});

export default router;
