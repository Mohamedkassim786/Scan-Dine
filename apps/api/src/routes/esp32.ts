import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../index';

const router = Router();

/**
 * GET /api/esp32/table-status/:tableId
 * Used by ESP32 non-touch table display microcontrollers over Wi-Fi.
 * Determines if the ESP32 screen should display the QR code or hide it while occupied.
 */
router.get('/table-status/:tableId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tableId = req.params.tableId as string;

    const table = await prisma.restaurantTable.findUnique({
      where: { id: tableId },
      include: {
        restaurant: { select: { slug: true, name: true } },
      },
    });

    if (!table || !table.isActive || table.isDeleted) {
      return res.status(404).json({ error: 'Table not found or disabled', showQR: false });
    }

    // Check for an active dining session
    const activeSession = await prisma.customerSession.findFirst({
      where: {
        tableId: table.id,
        isActive: true,
        status: 'active',
      } as any,
      orderBy: { createdAt: 'desc' },
    });

    const baseUrl = process.env.QR_BASE_URL || 'http://192.168.1.4:5173';
    const qrTargetUrl = `${baseUrl}/r/${table.restaurant.slug}/t/${table.qrToken}`;

    // If an active session is in progress, HIDE the QR code on the ESP32 screen
    if (activeSession) {
      return res.json({
        showQR: false,
        tableNumber: table.tableNumber,
        status: 'occupied',
        message: `Table ${table.tableNumber} Dining Session Active`,
        qrTargetUrl: null,
        qrCodeUrl: null,
        currentSessionId: activeSession.id,
      });
    }

    // Table is available: SHOW QR code on the ESP32 screen for the next customer
    return res.json({
      showQR: true,
      tableNumber: table.tableNumber,
      status: 'available',
      message: `Table ${table.tableNumber} Available - Scan to Order`,
      qrTargetUrl,
      qrCodeUrl: table.qrCodeUrl,
      currentSessionId: null,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/esp32/table-status/token/:token
 * ESP32 query by QR Token
 */
router.get('/table-status/token/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.params.token as string;

    const table = await prisma.restaurantTable.findUnique({
      where: { qrToken: token },
      include: {
        restaurant: { select: { slug: true, name: true } },
      },
    });

    if (!table || !table.isActive || table.isDeleted) {
      return res.status(404).json({ error: 'Table not found or disabled', showQR: false });
    }

    const activeSession = await prisma.customerSession.findFirst({
      where: {
        tableId: table.id,
        isActive: true,
        status: 'active',
      } as any,
      orderBy: { createdAt: 'desc' },
    });

    const baseUrl = process.env.QR_BASE_URL || 'http://192.168.1.4:5173';
    const qrTargetUrl = `${baseUrl}/r/${table.restaurant.slug}/t/${table.qrToken}`;

    if (activeSession) {
      return res.json({
        showQR: false,
        tableNumber: table.tableNumber,
        status: 'occupied',
        message: `Table ${table.tableNumber} Dining Session Active`,
        qrTargetUrl: null,
        qrCodeUrl: null,
        currentSessionId: activeSession.id,
      });
    }

    return res.json({
      showQR: true,
      tableNumber: table.tableNumber,
      status: 'available',
      message: `Table ${table.tableNumber} Available - Scan to Order`,
      qrTargetUrl,
      qrCodeUrl: table.qrCodeUrl,
      currentSessionId: null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
