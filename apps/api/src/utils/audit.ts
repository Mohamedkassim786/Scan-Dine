import { prisma } from '../index';

export interface AuditLogOptions {
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  metadata?: any;
  userId?: string;
  userName?: string;
  restaurantId: string;
  ipAddress?: string;
}

export async function logAudit(options: AuditLogOptions) {
  try {
    return await prisma.auditLog.create({
      data: {
        action: options.action,
        entity: options.entity,
        entityId: options.entityId || '',
        details: options.details || '',
        metadata: options.metadata ? JSON.stringify(options.metadata) : '{}',
        userId: options.userId,
        userName: options.userName || 'System',
        restaurantId: options.restaurantId,
        ipAddress: options.ipAddress || '127.0.0.1',
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
