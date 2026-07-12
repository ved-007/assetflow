import { prisma } from '../lib/prisma';
import { logActivity } from '../lib/logActivity';
import { notify } from '../lib/notify';
import { AppError } from '../lib/AppError';
import { TransferStatus } from '@prisma/client';

export async function listTransfers() {
  return prisma.transferRequest.findMany({
    include: {
      asset: true,
      fromEmployee: true,
      toEmployee: true,
      approvedBy: true,
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function requestTransfer(actorId: number, data: { assetId: number; toEmployeeId: number; reason: string }) {
  const allocation = await prisma.allocation.findFirst({
    where: { assetId: data.assetId, returnedAt: null }
  });
  if (!allocation) throw new AppError(404, 'Asset is not currently allocated');

  const transfer = await prisma.transferRequest.create({
    data: {
      assetId: data.assetId,
      fromEmployeeId: allocation.employeeId,
      toEmployeeId: data.toEmployeeId,
      reason: data.reason,
    }
  });

  await logActivity(actorId, 'REQUEST_TRANSFER', 'TransferRequest', transfer.id);
  return transfer;
}

export async function decideTransfer(id: number, actorId: number, decision: 'APPROVED' | 'REJECTED') {
  const transfer = await prisma.transferRequest.findUnique({ where: { id } });
  if (!transfer || transfer.status !== TransferStatus.REQUESTED) {
    throw new AppError(404, 'Pending transfer request not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.transferRequest.update({
      where: { id },
      data: {
        status: decision,
        approvedById: actorId,
        decidedAt: new Date(),
      }
    });

    if (decision === 'APPROVED') {
      const activeAlloc = await tx.allocation.findFirst({
        where: { assetId: transfer.assetId, returnedAt: null }
      });
      if (activeAlloc) {
        await tx.allocation.update({
          where: { id: activeAlloc.id },
          data: { returnedAt: new Date() }
        });
      }

      const toUser = await tx.user.findUnique({ where: { id: transfer.toEmployeeId } });
      await tx.allocation.create({
        data: {
          assetId: transfer.assetId,
          employeeId: transfer.toEmployeeId,
          departmentId: toUser?.departmentId,
        }
      });
    }
    return updated;
  });

  await logActivity(actorId, 'DECIDE_TRANSFER', 'TransferRequest', id, { decision });
  
  await notify(transfer.fromEmployeeId, 'transfer', 'Transfer Update', `Your transfer request was ${decision}`);
  await notify(transfer.toEmployeeId, 'transfer', 'Transfer Update', `An asset transfer to you was ${decision}`);

  return result;
}
