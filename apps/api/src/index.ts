import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import restaurantRoutes from './routes/restaurants';
import tableRoutes from './routes/tables';
import qrRoutes from './routes/qr';
import categoryRoutes from './routes/categories';
import menuRoutes from './routes/menu';
import addonRoutes from './routes/addons';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import chefRoutes from './routes/chefs';
import staffRoutes from './routes/staff';
import analyticsRoutes from './routes/analytics';
import aiInsightsRoutes from './routes/aiInsights';
import notificationRoutes from './routes/notifications';
import reportRoutes from './routes/reports';
import auditLogRoutes from './routes/auditLogs';
import profileRoutes from './routes/profile';
import uploadRoutes from './routes/upload';
import sessionRoutes from './routes/sessions';
import esp32Routes from './routes/esp32';
import { setupSocket } from './socket';

export const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: true, // Allow any origin on LAN/Wi-Fi
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Make io available to routes
app.set('io', io);

// Middleware - allow any LAN origin
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static(uploadsDir, { maxAge: '1d' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/esp32', esp32Routes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/addons', addonRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chefs', chefRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai-insights', aiInsightsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);

// Background job: Auto-clean abandoned dining sessions (every 5 minutes)
setInterval(async () => {
  try {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    // Find active sessions older than 30 mins
    const activeSessions = await prisma.customerSession.findMany({
      where: {
        isActive: true,
        updatedAt: { lte: thirtyMinsAgo },
      },
      include: {
        orders: { select: { status: true, paymentStatus: true } },
        table: true,
        restaurant: true,
      },
    });

    for (const session of activeSessions) {
      // Auto-close if all orders are delivered or cancelled
      const allDone = session.orders.length > 0 && session.orders.every(
        (o) => o.status === 'delivered' || o.status === 'cancelled'
      );

      if (allDone) {
        await prisma.customerSession.update({
          where: { id: session.id },
          data: { isActive: false, status: 'closed' } as any,
        });

        // Set table to available
        await prisma.restaurantTable.update({
          where: { id: session.tableId },
          data: { status: 'available' },
        });

        const payload = {
          tableId: session.tableId,
          tableNumber: session.table.tableNumber,
          sessionId: session.id,
        };

        io.to(`restaurant-${session.restaurantId}`).emit('session-closed', payload);
        io.to(`restaurant-${session.restaurantId}`).emit('table-updated', payload);
        io.emit('session-closed', payload);
        io.emit('table-updated', payload);
      }
    }
  } catch (err) {
    console.error('Error in session auto-cleanup background job:', err);
  }
}, 5 * 60 * 1000);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Socket setup
setupSocket(io);

const PORT = parseInt(process.env.PORT || '3001', 10);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🍽️  Scan & Dine API running on:`);
  console.log(`   ➜ Local:   http://localhost:${PORT}`);
  console.log(`   ➜ Network: http://192.168.1.4:${PORT}`);
  console.log(`📡 WebSocket server ready on 0.0.0.0:${PORT}`);
});
