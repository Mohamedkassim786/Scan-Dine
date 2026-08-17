import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '../utils/audit';
import { emitServiceRequest } from '../socket';

const router = Router();

// GET /api/tables?restaurantId=xxx
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req.query.restaurantId as string) || req.user?.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: 'Restaurant ID required' });

    const includeDeleted = req.query.includeDeleted === 'true';

    const tables = await prisma.restaurantTable.findMany({
      where: {
        restaurantId,
        ...(includeDeleted ? {} : { isDeleted: false }),
      },
      include: {
        orders: {
          where: { status: { in: ['new', 'accepted', 'preparing', 'ready'] } },
          select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { tableNumber: 'asc' },
    });
    return res.json(tables);
  } catch (error) { next(error); }
});

// POST /api/tables/service-request (Public diner assistance call)
router.post('/service-request', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { qrToken, requestType, note } = req.body;
    if (!qrToken) return res.status(400).json({ error: 'Table QR token required' });

    const table = await prisma.restaurantTable.findUnique({
      where: { qrToken },
      include: { restaurant: true },
    });
    if (!table) return res.status(404).json({ error: 'Table not found' });

    const labelMap: Record<string, string> = {
      waiter: 'Waiter Assistance Requested',
      water: 'Water / Refreshment Request',
      bill: 'Printed Bill Requested',
      cutlery: 'Extra Cutlery / Napkins',
    };

    const title = labelMap[requestType] || 'Table Service Request';
    const message = `Table ${table.tableNumber} requested: ${title}${note ? ` ("${note}")` : ''}`;

    const notification = await prisma.notification.create({
      data: {
        type: 'table_activity',
        title,
        message,
        restaurantId: table.restaurantId,
        metadata: JSON.stringify({ tableId: table.id, tableNumber: table.tableNumber, requestType }),
      },
    });

    const io = req.app.get('io');
    if (io) {
      const payload = {
        id: notification.id,
        tableNumber: table.tableNumber,
        requestType,
        title,
        message,
        createdAt: notification.createdAt,
      };
      emitServiceRequest(io, table.restaurantId, payload);
    }

    return res.status(201).json({ success: true, message: 'Service requested successfully' });
  } catch (error) { next(error); }
});

// POST /api/tables (admin)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tableNumber, capacity, status, restaurantId } = req.body;
    const rId = (restaurantId as string) || req.user?.restaurantId;
    if (!rId) return res.status(400).json({ error: 'Restaurant ID required' });
    if (!tableNumber) return res.status(400).json({ error: 'Table number required' });

    const num = Number(tableNumber);

    // Validate duplicate table number within the same restaurant
    const existing = await prisma.restaurantTable.findFirst({
      where: { restaurantId: rId, tableNumber: num, isDeleted: false },
    });
    if (existing) {
      return res.status(400).json({ error: `Table ${num} already exists in this restaurant` });
    }

    const qrToken = `tbl-token-${uuidv4()}`;
    const baseUrl = process.env.QR_BASE_URL || 'http://192.168.1.4:5173';
    const rest = await prisma.restaurant.findUnique({ where: { id: rId } });
    const qrUrl = `${baseUrl}/r/${rest?.slug || 'aurelian'}/t/${qrToken}`;

    const qrCodeUrl = await QRCode.toDataURL(qrUrl, {
      width: 512,
      margin: 2,
      color: { dark: '#121414', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    });

    const table = await prisma.restaurantTable.create({
      data: {
        tableNumber: num,
        capacity: Number(capacity) || 4,
        status: status || 'available',
        qrToken,
        qrCodeUrl,
        restaurantId: rId,
        isActive: true,
        isDeleted: false,
      },
    });

    await logAudit({
      action: 'TABLE_CREATED',
      entity: 'RestaurantTable',
      entityId: table.id,
      details: `Created Table ${table.tableNumber} (Capacity: ${table.capacity})`,
      userId: req.user?.id,
      userName: req.user?.name,
      restaurantId: rId,
    });

    return res.status(201).json(table);
  } catch (error) { next(error); }
});

// PUT /api/tables/:id (admin)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { tableNumber, capacity, status, isActive, isDeleted } = req.body;

    const current = await prisma.restaurantTable.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: 'Table not found' });

    if (tableNumber && Number(tableNumber) !== current.tableNumber) {
      const existing = await prisma.restaurantTable.findFirst({
        where: { restaurantId: current.restaurantId, tableNumber: Number(tableNumber), isDeleted: false, id: { not: id } },
      });
      if (existing) {
        return res.status(400).json({ error: `Table ${tableNumber} already exists in this restaurant` });
      }
    }

    const table = await prisma.restaurantTable.update({
      where: { id },
      data: {
        tableNumber: tableNumber ? Number(tableNumber) : undefined,
        capacity: capacity ? Number(capacity) : undefined,
        status,
        isActive,
        isDeleted,
      },
    });

    await logAudit({
      action: 'TABLE_UPDATED',
      entity: 'RestaurantTable',
      entityId: table.id,
      details: `Updated Table ${table.tableNumber} (Status: ${table.status})`,
      userId: req.user?.id,
      userName: req.user?.name,
      restaurantId: current.restaurantId,
    });

    return res.json(table);
  } catch (error) { next(error); }
});

// DELETE /api/tables/:id (admin)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const table = await prisma.restaurantTable.update({
      where: { id },
      data: { isDeleted: true, status: 'disabled' },
    });

    await logAudit({
      action: 'TABLE_DEACTIVATED',
      entity: 'RestaurantTable',
      entityId: table.id,
      details: `Deactivated Table ${table.tableNumber}`,
      userId: req.user?.id,
      userName: req.user?.name,
      restaurantId: table.restaurantId,
    });

    return res.json({ message: 'Table deactivated' });
  } catch (error) { next(error); }
});

// POST /api/tables/:id/restore (admin)
router.post('/:id/restore', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const table = await prisma.restaurantTable.update({
      where: { id },
      data: { isDeleted: false, status: 'available', isActive: true },
    });

    await logAudit({
      action: 'TABLE_RESTORED',
      entity: 'RestaurantTable',
      entityId: table.id,
      details: `Restored Table ${table.tableNumber}`,
      userId: req.user?.id,
      userName: req.user?.name,
      restaurantId: table.restaurantId,
    });

    return res.json(table);
  } catch (error) { next(error); }
});

// POST /api/tables/:id/regenerate-qr (admin)
router.post('/:id/regenerate-qr', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const newToken = `tbl-token-${uuidv4()}`;
    const table = await prisma.restaurantTable.update({
      where: { id },
      data: { qrToken: newToken },
      include: { restaurant: true },
    });

    const baseUrl = process.env.QR_BASE_URL || 'http://192.168.1.4:5173';
    const qrUrl = `${baseUrl}/r/${table.restaurant.slug}/t/${newToken}`;

    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 512, margin: 2,
      color: { dark: '#121414', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    });

    await prisma.restaurantTable.update({
      where: { id },
      data: { qrCodeUrl: qrDataUrl },
    });

    await logAudit({
      action: 'QR_REGENERATED',
      entity: 'RestaurantTable',
      entityId: table.id,
      details: `Regenerated QR token for Table ${table.tableNumber}`,
      userId: req.user?.id,
      userName: req.user?.name,
      restaurantId: table.restaurantId,
    });

    return res.json({ qrCodeUrl: qrDataUrl, qrUrl, tableNumber: table.tableNumber });
  } catch (error) { next(error); }
});

export default router;
