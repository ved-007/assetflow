import { prisma } from "./prisma";
import { emitToUser } from "./socket";

export async function notify(
  userId: number,
  type: string,
  title: string,
  body: string,
  link?: string,
): Promise<void> {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      link,
      read: false,
    },
  });

  emitToUser(userId, "notification:new", notification);
}
