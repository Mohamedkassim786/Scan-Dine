import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const router = Router();

// GET /api/staff?restaurantId=xxx (admin)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req.query.restaurantId as string) || req.user?.restaurantId;
    const { role } = req.query;

    const where: any = { ...(restaurantId ? { restaurantId } : {}) };
    if (role && role !== 'all') where.role = role as string;

    const staff = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatarUrl: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        restaurantId: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(staff);
  } catch (error) { next(error); }
});

// POST /api/staff (admin)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, role, phone, permissions, restaurantId } = req.body;
    const rId = (restaurantId as string) || req.user?.restaurantId;
    if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, and name are required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role || 'staff',
        phone: phone || '',
        permissions: Array.isArray(permissions) ? JSON.stringify(permissions) : permissions || '[]',
        restaurantId: rId,
      },
      select: {
        id: true, email: true, name: true, role: true, phone: true, isActive: true, createdAt: true,
      },
    });

    if (rId) {
      await logAudit({
        action: 'STAFF_CREATED',
        entity: 'User',
        entityId: user.id,
        details: `Created staff member ${user.name} (${user.role})`,
        userId: req.user?.id,
        userName: req.user?.name,
        restaurantId: rId,
      });
    }

    return res.status(201).json(user);
  } catch (error) { next(error); }
});

// PUT /api/staff/:id (admin)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, email, role, phone, permissions, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        phone,
        permissions: Array.isArray(permissions) ? JSON.stringify(permissions) : permissions,
        isActive,
      },
      select: {
        id: true, email: true, name: true, role: true, phone: true, isActive: true,
      },
    });

    return res.json(user);
  } catch (error) { next(error); }
});

// PATCH /api/staff/:id/password (admin)
router.patch('/:id/password', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return res.json({ message: 'Password updated successfully' });
  } catch (error) { next(error); }
});

// DELETE /api/staff/:id (admin)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    // Don't delete self
    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return res.json({ message: 'Staff member deactivated' });
  } catch (error) { next(error); }
});

export default router;
