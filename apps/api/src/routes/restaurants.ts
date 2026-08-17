import { Router, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const router = Router();

// GET /api/restaurants - get restaurant (public for QR flow)
router.get('/', async (_req, res: Response, next: NextFunction) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, slug: true, cuisine: true, description: true,
        logoUrl: true, coverUrl: true, address: true, phone: true, email: true,
        currency: true, taxPercentage: true, serviceChargePercentage: true,
        isOpen: true, isTemporarilyClosed: true, temporaryClosureReason: true,
        openTime: true, closeTime: true, weeklySchedule: true, isActive: true,
      },
    });
    return res.json(restaurants);
  } catch (error) { next(error); }
});

// GET /api/restaurants/:slug/demo-table (public demo helper)
router.get('/:slug/demo-table', async (req, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        tables: {
          where: { isActive: true, isDeleted: false },
          orderBy: { tableNumber: 'asc' },
          take: 1,
        },
      },
    });
    if (!restaurant || restaurant.tables.length === 0) {
      return res.status(404).json({ error: 'No tables found' });
    }
    return res.json({
      slug: restaurant.slug,
      tableNumber: restaurant.tables[0].tableNumber,
      qrToken: restaurant.tables[0].qrToken,
    });
  } catch (error) { next(error); }
});

// GET /api/restaurants/:id
router.get('/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        categories: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
      },
    });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    return res.json(restaurant);
  } catch (error) { next(error); }
});

// PUT /api/restaurants/:id (admin)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const {
      name, cuisine, description, logoUrl, coverUrl, address, phone, email,
      currency, taxPercentage, serviceChargePercentage, isOpen,
      isTemporarilyClosed, temporaryClosureReason, openTime, closeTime,
      weeklySchedule, isActive,
    } = req.body;

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        name, cuisine, description, logoUrl, coverUrl, address, phone, email,
        currency,
        taxPercentage: taxPercentage !== undefined ? Number(taxPercentage) : undefined,
        serviceChargePercentage: serviceChargePercentage !== undefined ? Number(serviceChargePercentage) : undefined,
        isOpen, isTemporarilyClosed, temporaryClosureReason,
        openTime, closeTime,
        weeklySchedule: typeof weeklySchedule === 'object' ? JSON.stringify(weeklySchedule) : weeklySchedule,
        isActive,
      },
    });

    await logAudit({
      action: 'RESTAURANT_SETTINGS_UPDATED',
      entity: 'Restaurant',
      entityId: restaurant.id,
      details: `Updated settings for ${restaurant.name}`,
      metadata: req.body,
      userId: req.user?.id,
      userName: req.user?.name,
      restaurantId: restaurant.id,
    });

    return res.json(restaurant);
  } catch (error) { next(error); }
});

export default router;
