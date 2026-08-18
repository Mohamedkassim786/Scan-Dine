import { Router, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../index';
import { authenticate, requireAdmin, requireChef, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const router = Router();

// Helper to safely delete previous locally uploaded image file from disk
const deleteLocalUploadFile = (imageUrl: string | null | undefined) => {
  if (!imageUrl) return;
  try {
    if (imageUrl.includes('/uploads/')) {
      const filename = imageUrl.split('/uploads/')[1]?.split('?')[0];
      if (filename) {
        const filePath = path.join(process.cwd(), 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
  } catch (err) {
    console.error('Failed to delete old upload file:', err);
  }
};

// GET /api/menu?restaurantId=xxx&categoryId=xxx (public)
router.get('/', async (req, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, categoryId, search, dietary, available, featured } = req.query;

    const where: any = {};
    if (restaurantId) where.restaurantId = restaurantId as string;
    if (categoryId && categoryId !== 'all') where.categoryId = categoryId as string;
    if (available === 'true') where.isAvailable = true;
    if (featured === 'true') where.isFeatured = true;
    if (dietary && dietary !== 'all') where.dietaryType = dietary as string;
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
        { ingredients: { contains: search as string } },
      ];
    }

    const items = await prisma.menuItem.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        addonGroups: {
          include: { options: { orderBy: { displayOrder: 'asc' } } },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: [{ isChefPick: 'desc' }, { isFeatured: 'desc' }, { isPopular: 'desc' }, { name: 'asc' }],
    });
    return res.json(items);
  } catch (error) { next(error); }
});

// GET /api/menu/:id (public)
router.get('/:id', async (req, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        addonGroups: {
          include: { options: { orderBy: { displayOrder: 'asc' } } },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
    if (!item) return res.status(404).json({ error: 'Menu item not found' });
    return res.json(item);
  } catch (error) { next(error); }
});

// POST /api/menu (admin)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      name, description, price, imageUrl, spiceLevel, prepTime, calories,
      dietaryType, isAvailable, isPopular, isChefPick, isFeatured, ingredients,
      allergens, nutrition, categoryId, restaurantId,
    } = req.body;
    const rId = (restaurantId as string) || req.user?.restaurantId;
    if (!rId) return res.status(400).json({ error: 'Restaurant ID required' });
    if (!name || !price || !categoryId) return res.status(400).json({ error: 'Name, price, and category required' });

    const item = await prisma.menuItem.create({
      data: {
        name, description: description || '', price: Number(price), imageUrl: imageUrl || '',
        spiceLevel: spiceLevel || 'mild', prepTime: Number(prepTime) || 15,
        calories: Number(calories) || 0, dietaryType: dietaryType || 'non-veg',
        isAvailable: isAvailable ?? true, isPopular: isPopular ?? false,
        isChefPick: isChefPick ?? false, isFeatured: isFeatured ?? false,
        ingredients: ingredients || '', allergens: allergens || '',
        nutrition: typeof nutrition === 'object' ? JSON.stringify(nutrition) : nutrition || '',
        categoryId, restaurantId: rId,
      },
      include: { category: true },
    });

    await logAudit({
      action: 'FOOD_CREATED',
      entity: 'MenuItem',
      entityId: item.id,
      details: `Created menu dish "${item.name}" (₹${item.price.toFixed(2)})`,
      userId: req.user?.id,
      userName: req.user?.name,
      restaurantId: rId,
    });

    return res.status(201).json(item);
  } catch (error) { next(error); }
});

// POST /api/menu/:id/duplicate (admin)
router.post('/:id/duplicate', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const original = await prisma.menuItem.findUnique({
      where: { id },
      include: { addonGroups: { include: { options: true } } },
    });
    if (!original) return res.status(404).json({ error: 'Dish not found' });

    const duplicated = await prisma.menuItem.create({
      data: {
        name: `${original.name} (Copy)`,
        description: original.description,
        price: original.price,
        imageUrl: original.imageUrl,
        spiceLevel: original.spiceLevel,
        prepTime: original.prepTime,
        calories: original.calories,
        dietaryType: original.dietaryType,
        isAvailable: original.isAvailable,
        isPopular: false,
        isChefPick: false,
        isFeatured: false,
        ingredients: original.ingredients,
        allergens: original.allergens,
        nutrition: original.nutrition,
        categoryId: original.categoryId,
        restaurantId: original.restaurantId,
      },
    });

    // Duplicate addon groups if any
    for (const group of original.addonGroups) {
      await prisma.addonGroup.create({
        data: {
          name: group.name,
          description: group.description,
          minSelections: group.minSelections,
          maxSelections: group.maxSelections,
          isRequired: group.isRequired,
          menuItemId: duplicated.id,
          options: {
            create: group.options.map((opt: any) => ({
              name: opt.name,
              price: opt.price,
              isAvailable: opt.isAvailable,
              displayOrder: opt.displayOrder,
            })),
          },
        },
      });
    }

    await logAudit({
      action: 'FOOD_DUPLICATED',
      entity: 'MenuItem',
      entityId: duplicated.id,
      details: `Duplicated dish from "${original.name}" to "${duplicated.name}"`,
      userId: req.user?.id,
      userName: req.user?.name,
      restaurantId: original.restaurantId,
    });

    return res.status(201).json(duplicated);
  } catch (error) { next(error); }
});

// PUT /api/menu/:id (admin)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const {
      name, description, price, imageUrl, spiceLevel, prepTime, calories,
      dietaryType, isAvailable, isPopular, isChefPick, isFeatured,
      ingredients, allergens, nutrition, categoryId,
    } = req.body;

    // Fetch existing item to check if imageUrl has changed
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (existing && existing.imageUrl && imageUrl && existing.imageUrl !== imageUrl) {
      deleteLocalUploadFile(existing.imageUrl);
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        name, description,
        price: price !== undefined ? Number(price) : undefined,
        imageUrl, spiceLevel,
        prepTime: prepTime !== undefined ? Number(prepTime) : undefined,
        calories: calories !== undefined ? Number(calories) : undefined,
        dietaryType, isAvailable, isPopular, isChefPick, isFeatured,
        ingredients, allergens,
        nutrition: typeof nutrition === 'object' ? JSON.stringify(nutrition) : nutrition,
        categoryId,
      },
      include: { category: true },
    });

    await logAudit({
      action: 'FOOD_EDITED',
      entity: 'MenuItem',
      entityId: item.id,
      details: `Updated details/pricing for "${item.name}"`,
      userId: req.user?.id,
      userName: req.user?.name,
      restaurantId: item.restaurantId,
    });

    return res.json(item);
  } catch (error) { next(error); }
});

// DELETE /api/menu/:id (admin)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const item = await prisma.menuItem.delete({ where: { id } });
    deleteLocalUploadFile(item.imageUrl);

    await logAudit({
      action: 'FOOD_DELETED',
      entity: 'MenuItem',
      entityId: id,
      details: `Deleted dish "${item.name}"`,
      userId: req.user?.id,
      userName: req.user?.name,
      restaurantId: item.restaurantId,
    });

    return res.json({ message: 'Menu item deleted' });
  } catch (error) { next(error); }
});

// PATCH /api/menu/:id/availability (chef / admin)
router.patch('/:id/availability', authenticate, requireChef, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { isAvailable } = req.body;

    const previousItem = await prisma.menuItem.findUnique({ where: { id } });
    if (!previousItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const previousStatus = previousItem.isAvailable ? 'Available' : 'Unavailable';
    const newStatus = isAvailable ? 'Available' : 'Unavailable';

    const item = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
      include: { category: { select: { id: true, name: true } } },
    });

    await logAudit({
      action: isAvailable ? 'FOOD_ACTIVATED' : 'FOOD_86_DEACTIVATED',
      entity: 'MenuItem',
      entityId: item.id,
      details: `${item.name}: ${previousStatus} → ${newStatus} (Changed by ${req.user?.role || 'Staff'} ${req.user?.name || ''})`,
      userId: req.user?.id,
      userName: req.user?.name,
      restaurantId: item.restaurantId,
    });

    // Broadcast Socket.IO event for real-time customer and staff menu updates
    const io = req.app.get('io');
    if (io) {
      io.to(`restaurant-${item.restaurantId}`).emit('menu-availability-changed', {
        menuItemId: item.id,
        isAvailable: item.isAvailable,
        menuItem: item,
      });
      io.emit('menu-availability-changed', {
        menuItemId: item.id,
        isAvailable: item.isAvailable,
        menuItem: item,
      });
    }

    return res.json(item);
  } catch (error) { next(error); }
});

export default router;
