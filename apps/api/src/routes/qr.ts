import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/qr/:token - Validate QR and return restaurant + table info
router.get('/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.params.token as string;

    const table = await prisma.restaurantTable.findUnique({
      where: { qrToken: token },
      include: {
        restaurant: {
          select: {
            id: true, name: true, slug: true, cuisine: true, description: true,
            logoUrl: true, coverUrl: true, address: true, phone: true,
            openTime: true, closeTime: true, isActive: true,
          },
        },
      },
    });

    if (!table) {
      return res.status(404).json({ error: 'Invalid QR code', code: 'QR_INVALID' });
    }

    if (!table.isActive) {
      return res.status(410).json({ error: 'This QR code has been deactivated', code: 'QR_DEACTIVATED' });
    }

    if (!table.restaurant.isActive) {
      return res.status(410).json({ error: 'Restaurant is currently unavailable', code: 'RESTAURANT_INACTIVE' });
    }

    let session = await prisma.customerSession.findFirst({
      where: {
        tableId: table.id,
        restaurantId: table.restaurantId,
        isActive: true,
        status: 'active',
        createdAt: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) },
      } as any,
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      session = await prisma.customerSession.create({
        data: {
          sessionToken: uuidv4(),
          restaurantId: table.restaurantId,
          tableId: table.id,
        },
      });
    }

    return res.json({
      restaurant: table.restaurant,
      table: {
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        status: table.status,
      },
      session: {
        id: session.id,
        token: session.sessionToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
