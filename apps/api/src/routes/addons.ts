import { Router, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const router = Router();

// GET /api/addons?menuItemId=xxx
router.get('/', async (req, res: Response, next: NextFunction) => {
  try {
    const menuItemId = req.query.menuItemId as string;
    const where: any = {};
    if (menuItemId) where.menuItemId = menuItemId;

    const groups = await prisma.addonGroup.findMany({
      where,
      include: {
        options: { orderBy: { displayOrder: 'asc' } },
        menuItem: { select: { id: true, name: true, price: true } },
      },
      orderBy: { displayOrder: 'asc' },
    });
    return res.json(groups);
  } catch (error) { next(error); }
});

// POST /api/addons/groups (admin)
router.post('/groups', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, minSelections, maxSelections, isRequired, menuItemId, options } = req.body;
    if (!name || !menuItemId) return res.status(400).json({ error: 'Name and MenuItem ID required' });

    const group = await prisma.addonGroup.create({
      data: {
        name,
        description: description || '',
        minSelections: Number(minSelections) || 0,
        maxSelections: Number(maxSelections) || 1,
        isRequired: isRequired ?? (Number(minSelections) > 0),
        menuItemId,
        options: Array.isArray(options) && options.length > 0 ? {
          create: options.map((opt: any, idx: number) => ({
            name: opt.name,
            price: Number(opt.price) || 0,
            displayOrder: idx,
            isAvailable: opt.isAvailable ?? true,
          })),
        } : undefined,
      },
      include: { options: true },
    });

    if (req.user?.restaurantId) {
      await logAudit({
        action: 'ADDON_GROUP_CREATED',
        entity: 'AddonGroup',
        entityId: group.id,
        details: `Created add-on group "${group.name}"`,
        userId: req.user.id,
        userName: req.user.name,
        restaurantId: req.user.restaurantId,
      });
    }

    return res.status(201).json(group);
  } catch (error) { next(error); }
});

// PUT /api/addons/groups/:id (admin)
router.put('/groups/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, description, minSelections, maxSelections, isRequired } = req.body;

    const group = await prisma.addonGroup.update({
      where: { id },
      data: {
        name,
        description,
        minSelections: minSelections !== undefined ? Number(minSelections) : undefined,
        maxSelections: maxSelections !== undefined ? Number(maxSelections) : undefined,
        isRequired,
      },
      include: { options: true },
    });

    return res.json(group);
  } catch (error) { next(error); }
});

// DELETE /api/addons/groups/:id (admin)
router.delete('/groups/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.addonOption.deleteMany({ where: { addonGroupId: id } });
    await prisma.addonGroup.delete({ where: { id } });
    return res.json({ message: 'Addon group deleted' });
  } catch (error) { next(error); }
});

// POST /api/addons/options (admin)
router.post('/options', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { addonGroupId, name, price, isAvailable } = req.body;
    if (!addonGroupId || !name) return res.status(400).json({ error: 'Addon Group ID and Name required' });

    const option = await prisma.addonOption.create({
      data: {
        addonGroupId,
        name,
        price: Number(price) || 0,
        isAvailable: isAvailable ?? true,
      },
    });
    return res.status(201).json(option);
  } catch (error) { next(error); }
});

// PUT /api/addons/options/:id (admin)
router.put('/options/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, price, isAvailable } = req.body;

    const option = await prisma.addonOption.update({
      where: { id },
      data: {
        name,
        price: price !== undefined ? Number(price) : undefined,
        isAvailable,
      },
    });
    return res.json(option);
  } catch (error) { next(error); }
});

// DELETE /api/addons/options/:id (admin)
router.delete('/options/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.addonOption.delete({ where: { id } });
    return res.json({ message: 'Addon option deleted' });
  } catch (error) { next(error); }
});

export default router;
