import { prisma } from '../lib/prisma';

export async function getReport(type: string) {
  if (type === 'utilization') {
    return prisma.asset.groupBy({
      by: ['categoryId'],
      _count: { id: true }
    });
  } else if (type === 'status') {
    return prisma.asset.groupBy({
      by: ['status'],
      _count: { id: true }
    });
  }
  return { message: 'Report type not implemented yet' };
}
