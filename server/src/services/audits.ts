import { prisma } from '../lib/prisma';
import { logActivity } from '../lib/logActivity';
import { notify } from '../lib/notify';
import { AppError } from '../lib/AppError';
import { AuditCycleStatus, AuditItemResult, AssetStatus, Prisma } from '@prisma/client';

export async function listAudits() {
  return prisma.auditCycle.findMany({
    include: {
      createdBy: true,
      department: true,
      assignments: { include: { auditor: true } },
      items: { include: { asset: true, checkedBy: true } },
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createAuditCycle(actorId: number, data: { name: string; departmentId?: number; location?: string; startDate: string; endDate: string; auditorIds: number[] }) {
  const where: Prisma.AssetWhereInput = {
    status: { notIn: [AssetStatus.RETIRED, AssetStatus.DISPOSED] },
  };
  
  if (data.departmentId) {
    where.allocations = {
      some: {
        departmentId: data.departmentId,
        returnedAt: null,
      }
    };
  }
  if (data.location) {
    where.location = { contains: data.location };
  }

  const assetsToAudit = await prisma.asset.findMany({ where, select: { id: true } });

  const cycle = await prisma.$transaction(async (tx) => {
    const createdCycle = await tx.auditCycle.create({
      data: {
        name: data.name,
        departmentId: data.departmentId,
        location: data.location,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        createdById: actorId,
        assignments: {
          create: data.auditorIds.map((id) => ({ auditorId: id }))
        },
        items: {
          create: assetsToAudit.map((a) => ({ assetId: a.id }))
        }
      },
      include: { assignments: true, items: true }
    });

    return createdCycle;
  });

  await logActivity(actorId, 'CREATE_AUDIT', 'AuditCycle', cycle.id, { name: data.name, itemsCount: assetsToAudit.length });

  for (const auditor of data.auditorIds) {
    await notify(auditor, 'audit', 'New Audit Assignment', `You have been assigned to audit: ${data.name}`);
  }

  return cycle;
}

export async function markAuditItem(cycleId: number, itemId: number, actorId: number, data: { result: 'VERIFIED' | 'MISSING' | 'DAMAGED'; notes?: string }) {
  const item = await prisma.auditItem.findFirst({
    where: { id: itemId, cycleId }
  });
  if (!item) throw new AppError(404, 'Audit item not found');

  const assignment = await prisma.auditAssignment.findFirst({
    where: { cycleId, auditorId: actorId }
  });
  if (!assignment) throw new AppError(403, 'You are not assigned as an auditor for this cycle');

  const updated = await prisma.auditItem.update({
    where: { id: itemId },
    data: {
      result: data.result as AuditItemResult,
      notes: data.notes,
      checkedById: actorId,
      checkedAt: new Date(),
    }
  });

  await logActivity(actorId, 'MARK_AUDIT_ITEM', 'AuditItem', itemId, { result: data.result });
  return updated;
}

export async function closeAuditCycle(id: number, actorId: number) {
  const cycle = await prisma.auditCycle.findUnique({
    where: { id },
    include: { items: true }
  });
  if (!cycle || cycle.status !== AuditCycleStatus.OPEN) {
    throw new AppError(404, 'Open audit cycle not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.auditCycle.update({
      where: { id },
      data: { status: AuditCycleStatus.CLOSED }
    });

    const missingItems = cycle.items.filter(i => i.result === AuditItemResult.MISSING);
    if (missingItems.length > 0) {
      const assetIds = missingItems.map(i => i.assetId);
      await tx.asset.updateMany({
        where: { id: { in: assetIds } },
        data: { status: AssetStatus.LOST }
      });
    }

    return updated;
  });

  await logActivity(actorId, 'CLOSE_AUDIT', 'AuditCycle', id);
  return result;
}
