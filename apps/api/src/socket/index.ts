import { Server as SocketIOServer, Socket } from 'socket.io';

export function setupSocket(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    // Staff & Kitchen join single restaurant room
    socket.on('join-kitchen', (restaurantId: string) => {
      socket.join(`restaurant-${restaurantId}`);
    });

    socket.on('join-admin', (restaurantId: string) => {
      socket.join(`restaurant-${restaurantId}`);
    });

    // Customer joins their order room for tracking
    socket.on('join-order', (orderId: string) => {
      socket.join(`order-${orderId}`);
    });

    // Customer joins their session room
    socket.on('join-session', (sessionId: string) => {
      socket.join(`session-${sessionId}`);
    });
  });
}

// Helper to emit new orders to staff (single room emission)
export function emitNewOrder(io: SocketIOServer, restaurantId: string, order: any) {
  io.to(`restaurant-${restaurantId}`).emit('new-order', order);
}

// Helper to emit order status updates to customer and kitchen (single room emission)
export function emitOrderStatusUpdate(io: SocketIOServer, orderId: string, status: string, order: any) {
  io.to(`order-${orderId}`).emit('order-status-update', { orderId, status, order });
  io.to(`restaurant-${order.restaurantId}`).emit('order-status-update', { orderId, status, order });
}

// Helper to emit table service requests to staff (single room emission)
export function emitServiceRequest(io: SocketIOServer, restaurantId: string, requestData: any) {
  io.to(`restaurant-${restaurantId}`).emit('service-request', requestData);
}
