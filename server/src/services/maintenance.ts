import { prisma } from '../lib/prisma';
import { logActivity } from '../lib/logActivity';
import { notify } from '../lib/notify';
import { AppError } from '../lib/AppError';
import { AssetStatus, MaintenanceStatus, MaintenancePriority } from '@prisma/client';

export async function listMaintenance(actorId: number, tab: 'all' | 'mine') {
  return prisma.maintenanceRequest.findMany({
    where: tab === 'mine' ? { raisedById: actorId } : {},
    include: {
      asset: true,
      raisedBy: true,
      approvedBy: true,
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function raiseMaintenance(actorId: number, data: { assetId: number; description: string; priority: MaintenancePriority; photoUrl?: string }) {
  const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
  if (!asset) throw new AppError(404, 'Asset not found');

  const request = await prisma.maintenanceRequest.create({
    data: {
      assetId: data.assetId,
      raisedById: actorId,
      description: data.description,
      priority: data.priority,
      photoUrl: data.photoUrl,
    }
  });

  await logActivity(actorId, 'RAISE_MAINTENANCE', 'MaintenanceRequest', request.id);
  return request;
}

export async function decideMaintenance(id: number, actorId: number, decision: 'APPROVED' | 'REJECTED') {
  const request = await prisma.maintenanceRequest.findUnique({ where: { id } });
  if (!request || request.status !== MaintenanceStatus.PENDING) {
    throw new AppError(404, 'Pending maintenance request not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRequest.update({
      where: { id },
      data: {
        status: decision as MaintenanceStatus,
        approvedById: actorId,
      }
    });

    if (decision === 'APPROVED') {
      await tx.asset.update({
        where: { id: request.assetId },
        data: { status: AssetStatus.UNDER_MAINTENANCE }
      });
    }

    return updated;
  });

  await logActivity(actorId, 'DECIDE_MAINTENANCE', 'MaintenanceRequest', id, { decision });
  await notify(request.raisedById, 'maintenance', 'Maintenance Update', `Your maintenance request was ${decision}`);

  return result;
}

export async function assignTechnician(id: number, actorId: number, technicianName: string) {
  const request = await prisma.maintenanceRequest.findUnique({ where: { id } });
  if (!request || request.status !== MaintenanceStatus.APPROVED) {
    throw new AppError(404, 'Approved maintenance request not found');
  }

  const updated = await prisma.maintenanceRequest.update({
    where: { id },
    data: {
      status: MaintenanceStatus.TECHNICIAN_ASSIGNED,
      technicianName,
    }
  });

  await logActivity(actorId, 'ASSIGN_TECHNICIAN', 'MaintenanceRequest', id, { technicianName });
  return updated;
}

export async function updateStatus(id: number, actorId: number, status: 'IN_PROGRESS' | 'RESOLVED') {
  const request = await prisma.maintenanceRequest.findUnique({ where: { id } });
  if (!request || (request.status !== MaintenanceStatus.TECHNICIAN_ASSIGNED && request.status !== MaintenanceStatus.IN_PROGRESS)) {
    throw new AppError(404, 'Valid maintenance request not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRequest.update({
      where: { id },
      data: {
        status: status as MaintenanceStatus,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
      }
    });

    if (status === 'RESOLVED') {
      await tx.asset.update({
        where: { id: request.assetId },
        data: { status: AssetStatus.AVAILABLE }
      });
    }

    return updated;
  });

  await logActivity(actorId, 'UPDATE_MAINTENANCE_STATUS', 'MaintenanceRequest', id, { status });
  if (status === 'RESOLVED') {
    await notify(request.raisedById, 'maintenance', 'Maintenance Resolved', `Your maintenance request has been resolved`);
  }

  return result;
}
