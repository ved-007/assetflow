import { prisma } from '../lib/prisma';
import { logActivity } from '../lib/logActivity';
import { AppError } from '../lib/AppError';
import { AssetStatus, Prisma } from '@prisma/client';

export async function listAssets(query: any) {
  const where: Prisma.AssetWhereInput = {};
  
  if (query.q) {
    where.OR = [
      { name: { contains: query.q } },
      { assetTag: { contains: query.q } },
      { serialNumber: { contains: query.q } },
    ];
  }
  if (query.category) where.categoryId = parseInt(query.category, 10);
  if (query.status) where.status = query.status as AssetStatus;
  if (query.location) where.location = { contains: query.location };

  return prisma.asset.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function registerAsset(actorId: number, data: any) {
  const newAsset = await prisma.$transaction(async (tx) => {
    const asset = await tx.asset.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        serialNumber: data.serialNumber,
        acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : undefined,
        acquisitionCost: data.acquisitionCost,
        condition: data.condition,
        location: data.location,
        isBookable: data.isBookable || false,
        photoUrl: data.photoUrl,
        assetTag: 'TMP', // Placeholder
        status: AssetStatus.AVAILABLE,
      },
    });

    const assetTag = `AF-${String(asset.id).padStart(4, '0')}`;
    return tx.asset.update({
      where: { id: asset.id },
      data: { assetTag },
    });
  });

  await logActivity(actorId, 'REGISTER_ASSET', 'Asset', newAsset.id, { name: newAsset.name, tag: newAsset.assetTag });
  return newAsset;
}

export async function editAsset(id: number, actorId: number, data: any) {
  const existing = await prisma.asset.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Asset not found');

  const updated = await prisma.asset.update({
    where: { id },
    data: {
      ...data,
      acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : undefined,
    }
  });

  await logActivity(actorId, 'EDIT_ASSET', 'Asset', updated.id, { changes: data });
  return updated;
}

export async function getAsset(id: number) {
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      category: true,
      allocations: { include: { employee: true }, orderBy: { allocatedAt: 'desc' } },
      maintenanceRequests: { include: { raisedBy: true }, orderBy: { createdAt: 'desc' } },
      bookings: { include: { bookedBy: true }, orderBy: { startTime: 'desc' } }
    }
  });
  if (!asset) throw new AppError(404, 'Asset not found');
  return asset;
}
