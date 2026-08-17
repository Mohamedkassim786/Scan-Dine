import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/chefs (admin)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req.query.restaurantId as string) || req.user?.restaurantId;
    const chefs = await prisma.user.findMany({
      where: { role: 'chef', ...(restaurantId ? { restaurantId } : {}) },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, restaurantId: true },
    });
    return res.json(chefs);
  } catch (error) { next(error); }
});

// POST /api/chefs (admin)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, restaurantId } = req.body;
    const rId = (restaurantId as string) || req.user?.restaurantId;
    if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, and name required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const chef = await prisma.user.create({
      data: { email, passwordHash, name, role: 'chef', restaurantId: rId },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
    return res.status(201).json(chef);
  } catch (error) { next(error); }
});

// PUT /api/chefs/:id (admin)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, email, isActive } = req.body;
    const chef = await prisma.user.update({
      where: { id },
      data: { name, email, isActive },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    return res.json(chef);
  } catch (error) { next(error); }
});

// PATCH /api/chefs/:id/reset-password (admin)
router.patch('/:id/reset-password', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'New password required' });

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
    return res.json({ message: 'Password reset successfully' });
  } catch (error) { next(error); }
});

export default router;
