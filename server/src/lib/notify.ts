import { prisma } from './prisma';
import { emitToUser } from './socket';

export async function notify(userId: number, type: string, title: string, body: string, link?: string) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      link,
    },
  });

  emitToUser(userId, 'notification:new', notification);
  return notification;
}
