import { prisma } from '../lib/prisma';
import { logActivity } from '../lib/logActivity';
import { AppError } from '../lib/AppError';
import { BookingStatus, Prisma } from '@prisma/client';

export async function listBookings(query: any) {
  const where: Prisma.BookingWhereInput = {};
  if (query.assetId) where.assetId = query.assetId;
  if (query.from && query.to) {
    where.startTime = { gte: new Date(query.from) };
    where.endTime = { lte: new Date(query.to) };
  }

  return prisma.booking.findMany({
    where,
    include: { asset: true, bookedBy: true },
    orderBy: { startTime: 'asc' }
  });
}

export async function createBooking(actorId: number, data: { assetId: number; startTime: string; endTime: string; purpose: string }) {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);

  const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
  if (!asset || !asset.isBookable) {
    throw new AppError(400, 'Asset is not bookable');
  }

  const booking = await prisma.$transaction(async (tx) => {
    const overlaps = await tx.$queryRaw`
      SELECT id FROM bookings 
      WHERE assetId = ${data.assetId} 
        AND status <> 'CANCELLED' 
        AND startTime < ${end} 
        AND endTime > ${start} 
      FOR UPDATE
    `;
    
    if (Array.isArray(overlaps) && overlaps.length > 0) {
      throw new AppError(409, 'This slot overlaps an existing booking');
    }

    return tx.booking.create({
      data: {
        assetId: data.assetId,
        bookedById: actorId,
        startTime: start,
        endTime: end,
        purpose: data.purpose,
      }
    });
  });

  await logActivity(actorId, 'CREATE_BOOKING', 'Booking', booking.id, { assetId: data.assetId, start, end });
  return booking;
}

export async function cancelBooking(id: number, actorId: number) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new AppError(404, 'Booking not found');
  
  const user = await prisma.user.findUnique({ where: { id: actorId } });
  if (booking.bookedById !== actorId && !['ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'].includes(user?.role || '')) {
    throw new AppError(403, 'You can only cancel your own bookings');
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: BookingStatus.CANCELLED }
  });

  await logActivity(actorId, 'CANCEL_BOOKING', 'Booking', id);
  return updated;
}
