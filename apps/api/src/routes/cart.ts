import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/cart?sessionToken=xxx
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionToken = req.query.sessionToken as string;
    if (!sessionToken) return res.status(400).json({ error: 'Session token required' });

    const session = await prisma.customerSession.findUnique({ where: { sessionToken } });
    if (!session) return res.status(404).json({ error: 'Invalid session' });

    const cart = await prisma.cart.findUnique({
      where: { sessionId: session.id },
      include: {
        items: {
          include: { menuItem: { select: { id: true, name: true, price: true, imageUrl: true } } },
        },
      },
    });

    if (!cart) return res.json({ items: [], subtotal: 0, tax: 0, total: 0 });

    const subtotal = cart.items.reduce((sum: number, item: any) => sum + item.menuItem.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% tax
    const total = Math.round((subtotal + tax) * 100) / 100;

    return res.json({
      id: cart.id,
      items: cart.items.map((item: any) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.menuItem.name,
        price: item.menuItem.price,
        imageUrl: item.menuItem.imageUrl,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
        itemTotal: item.menuItem.price * item.quantity,
      })),
      subtotal,
      tax,
      total,
    });
  } catch (error) { next(error); }
});

// POST /api/cart/add
router.post('/add', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionToken, menuItemId, quantity, specialInstructions } = req.body;
    if (!sessionToken || !menuItemId) return res.status(400).json({ error: 'Session token and menu item ID required' });

    const session = await prisma.customerSession.findUnique({ where: { sessionToken } });
    if (!session) return res.status(404).json({ error: 'Invalid session' });

    // Get or create cart
    let cart = await prisma.cart.findUnique({ where: { sessionId: session.id } });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId: session.id, tableId: session.tableId },
      });
    }

    // Upsert cart item
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_menuItemId: { cartId: cart.id, menuItemId } },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + (quantity || 1),
          specialInstructions: specialInstructions || existingItem.specialInstructions,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          menuItemId,
          quantity: quantity || 1,
          specialInstructions: specialInstructions || '',
        },
      });
    }

    return res.json({ message: 'Item added to cart' });
  } catch (error) { next(error); }
});

// PUT /api/cart/update
router.put('/update', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionToken, menuItemId, quantity } = req.body;
    const session = await prisma.customerSession.findUnique({ where: { sessionToken } });
    if (!session) return res.status(404).json({ error: 'Invalid session' });

    const cart = await prisma.cart.findUnique({ where: { sessionId: session.id } });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: { cartId_menuItemId: { cartId: cart.id, menuItemId } },
      });
    } else {
      await prisma.cartItem.update({
        where: { cartId_menuItemId: { cartId: cart.id, menuItemId } },
        data: { quantity },
      });
    }

    return res.json({ message: 'Cart updated' });
  } catch (error) { next(error); }
});

// DELETE /api/cart/remove
router.delete('/remove', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionToken, menuItemId } = req.body;
    const session = await prisma.customerSession.findUnique({ where: { sessionToken } });
    if (!session) return res.status(404).json({ error: 'Invalid session' });

    const cart = await prisma.cart.findUnique({ where: { sessionId: session.id } });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    await prisma.cartItem.delete({
      where: { cartId_menuItemId: { cartId: cart.id, menuItemId } },
    });

    return res.json({ message: 'Item removed from cart' });
  } catch (error) { next(error); }
});

export default router;
