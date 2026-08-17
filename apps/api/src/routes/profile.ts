import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const router = Router();

// GET /api/profile (me)
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatarUrl: true,
        restaurantId: true,
        restaurant: {
          select: { id: true, name: true, slug: true, logoUrl: true, currency: true },
        },
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) { next(error); }
});

// PUT /api/profile (me)
router.put('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, phone, avatarUrl } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user?.id },
      data: {
        name,
        phone: phone !== undefined ? phone : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      },
      select: {
        id: true, email: true, name: true, role: true, phone: true, avatarUrl: true, restaurantId: true,
      },
    });

    if (req.user?.restaurantId) {
      await logAudit({
        action: 'PROFILE_UPDATED',
        entity: 'User',
        entityId: user.id,
        details: `Admin profile updated for ${user.name}`,
        userId: user.id,
        userName: user.name,
        restaurantId: req.user.restaurantId,
      });
    }

    return res.json(user);
  } catch (error) { next(error); }
});

// PATCH /api/profile/password (me)
router.patch('/password', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) return res.status(400).json({ error: 'Current password is incorrect' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    if (user.restaurantId) {
      await logAudit({
        action: 'PASSWORD_CHANGED',
        entity: 'User',
        entityId: user.id,
        details: 'Admin account password changed successfully',
        userId: user.id,
        userName: user.name,
        restaurantId: user.restaurantId,
      });
    }

    return res.json({ message: 'Password updated successfully' });
  } catch (error) { next(error); }
});

export default router;
