import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export async function listLogs(query: any) {
  const where: Prisma.ActivityLogWhereInput = {};
  if (query.actor) where.actorId = parseInt(query.actor, 10);
  if (query.from && query.to) {
    where.createdAt = {
      gte: new Date(query.from),
      lte: new Date(query.to),
    };
  }

  return prisma.activityLog.findMany({
    where,
    include: { actor: true },
    orderBy: { createdAt: 'desc' }
  });
}
