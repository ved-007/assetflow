import { prisma } from "./prisma";
import { emitToUser } from "./socket";

function mapNotificationType(type: string) {
  switch (type.toLowerCase()) {
    case "success":
      return "Success";
    case "warning":
      return "Warning";
    case "error":
      return "Error";
    default:
      return "Info";
  }
}

export async function notify(
  userId: number,
  type: string,
  title: string,
  body: string,
  link?: string,
): Promise<void> {
  const notification = await prisma.notifications.create({
    data: {
      user_id: userId,
      title,
      message: link ? `${body}\n${link}` : body,
      notification_type: mapNotificationType(type),
      is_read: false,
    },
  });

  emitToUser(userId, "notification:new", notification);
}
