import { prisma } from '../lib/prisma';
import { logActivity } from '../lib/logActivity';
import { AppError } from '../lib/AppError';
import { AssetStatus } from '@prisma/client';

export async function listAllocations(tab: 'active' | 'history') {
  return prisma.allocation.findMany({
    where: tab === 'active' ? { returnedAt: null } : { returnedAt: { not: null } },
    include: {
      asset: true,
      employee: true,
      department: true,
    },
    orderBy: { allocatedAt: 'desc' }
  });
}

export async function allocateAsset(actorId: number, data: { assetId: number; employeeId: number; expectedReturnDate?: string }) {
  const employee = await prisma.user.findUnique({ where: { id: data.employeeId } });
  if (!employee) throw new AppError(404, 'Employee not found');

  const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
  if (!asset) throw new AppError(404, 'Asset not found');
  if (asset.status !== AssetStatus.AVAILABLE) {
    const activeAlloc = await prisma.allocation.findFirst({
      where: { assetId: data.assetId, returnedAt: null },
      include: { employee: true },
    });
    if (activeAlloc) {
      throw new AppError(409, `This asset is currently held by ${activeAlloc.employee.name}`);
    }
    throw new AppError(409, 'Asset is not available for allocation');
  }

  const allocation = await prisma.$transaction(async (tx) => {
    const alloc = await tx.allocation.create({
      data: {
        assetId: data.assetId,
        employeeId: data.employeeId,
        departmentId: employee.departmentId,
        expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : undefined,
      }
    });

    await tx.asset.update({
      where: { id: data.assetId },
      data: { status: AssetStatus.ALLOCATED }
    });

    return alloc;
  });

  await logActivity(actorId, 'ALLOCATE_ASSET', 'Asset', data.assetId, { allocationId: allocation.id, employeeId: data.employeeId });
  return allocation;
}

export async function returnAsset(allocationId: number, actorId: number, data: { condition?: string; notes?: string }) {
  const allocation = await prisma.allocation.findUnique({ where: { id: allocationId } });
  if (!allocation || allocation.returnedAt) {
    throw new AppError(404, 'Active allocation not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    const ret = await tx.allocation.update({
      where: { id: allocationId },
      data: {
        returnedAt: new Date(),
        checkinCondition: data.condition,
        checkinNotes: data.notes,
      }
    });

    await tx.asset.update({
      where: { id: allocation.assetId },
      data: { status: AssetStatus.AVAILABLE, condition: data.condition || undefined }
    });

    return ret;
  });

  await logActivity(actorId, 'RETURN_ASSET', 'Asset', allocation.assetId, { allocationId, condition: data.condition });
  return result;
}
