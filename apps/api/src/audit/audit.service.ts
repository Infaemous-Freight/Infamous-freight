/**
 * RECOMMENDATION: Audit Log System
 * Track all user actions for compliance and security
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum AuditAction {
  // Auth
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  MFA_ENABLED = 'MFA_ENABLED',
  
  // Loads
  LOAD_CREATED = 'LOAD_CREATED',
  LOAD_UPDATED = 'LOAD_UPDATED',
  LOAD_DELETED = 'LOAD_DELETED',
  LOAD_ASSIGNED = 'LOAD_ASSIGNED',
  LOAD_STATUS_CHANGED = 'LOAD_STATUS_CHANGED',
  
  // Drivers
  DRIVER_CREATED = 'DRIVER_CREATED',
  DRIVER_UPDATED = 'DRIVER_UPDATED',
  DRIVER_DELETED = 'DRIVER_DELETED',
  
  // Billing
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_CANCELED = 'SUBSCRIPTION_CANCELED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',
  PAYMENT_SUCCEEDED = 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  
  // Documents
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_DELETED = 'DOCUMENT_DELETED',
  DOCUMENT_DOWNLOADED = 'DOCUMENT_DOWNLOADED',
  
  // Settings
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
  USER_INVITED = 'USER_INVITED',
  USER_REMOVED = 'USER_REMOVED',
  
  // Security
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

interface AuditLogEntry {
  userId: string;
  companyId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(entry: AuditLogEntry) {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        companyId: entry.companyId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        details: entry.details,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        createdAt: new Date(),
      },
    });
  }

  async getAuditLogs(filters: {
    companyId?: string;
    userId?: string;
    action?: AuditAction;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 50, ...where } = filters;
    
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  }

  async getSecurityAlerts(companyId: string, hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return this.prisma.auditLog.findMany({
      where: {
        companyId,
        createdAt: { gte: since },
        action: {
          in: [
            AuditAction.SUSPICIOUS_ACTIVITY,
            AuditAction.PAYMENT_FAILED,
            AuditAction.USER_REMOVED,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async exportAuditLogs(companyId: string, startDate: Date, endDate: Date) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        companyId,
        createdAt: { gte: startDate, lte: endDate },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    });

    // Convert to CSV
    const headers = ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'Details', 'IP Address'];
    const rows = logs.map(log => [
      log.createdAt.toISOString(),
      log.user?.email || 'Unknown',
      log.action,
      log.resourceType,
      log.resourceId || '',
      JSON.stringify(log.details),
      log.ipAddress || '',
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}
