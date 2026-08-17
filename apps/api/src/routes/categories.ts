import { Router, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/categories?restaurantId=xxx (public)
router.get('/', async (req, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.query.restaurantId as string;
    const categories = await prisma.category.findMany({
      where: {
        ...(restaurantId ? { restaurantId } : {}),
        isActive: true,
      },
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { menuItems: true } } },
    });
    return res.json(categories);
  } catch (error) { next(error); }
});

// POST /api/categories (admin)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, displayOrder, restaurantId } = req.body;
    const rId = (restaurantId as string) || req.user?.restaurantId;
    if (!rId) return res.status(400).json({ error: 'Restaurant ID required' });

    const category = await prisma.category.create({
      data: { name, description: description || '', displayOrder: Number(displayOrder) || 0, restaurantId: rId },
    });
    return res.status(201).json(category);
  } catch (error) { next(error); }
});

// PUT /api/categories/:id (admin)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, description, displayOrder, isActive } = req.body;
    const category = await prisma.category.update({
      where: { id },
      data: { name, description, displayOrder: displayOrder !== undefined ? Number(displayOrder) : undefined, isActive },
    });
    return res.json(category);
  } catch (error) { next(error); }
});

// DELETE /api/categories/:id (admin)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.category.delete({ where: { id } });
    return res.json({ message: 'Category deleted' });
  } catch (error) { next(error); }
});

// PATCH /api/categories/reorder (admin)
router.patch('/reorder', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds array required' });

    await Promise.all(
      orderedIds.map((id: string, index: number) =>
        prisma.category.update({ where: { id }, data: { displayOrder: index } })
      )
    );
    return res.json({ message: 'Categories reordered' });
  } catch (error) { next(error); }
});

export default router;
