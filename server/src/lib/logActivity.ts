import { prisma } from './prisma';

export async function logActivity(actorId: number, action: string, entityType: string, entityId: number, details?: any) {
  return prisma.activityLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      details: details ? details : undefined,
    },
  });
}
