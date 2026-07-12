import { prisma } from '../lib/prisma';

export async function listNotifications(userId: number) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function markRead(userId: number, id: number) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true }
  });
}

export async function markAllRead(userId: number) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true }
  });
}
