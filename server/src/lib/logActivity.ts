import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

export async function logActivity(
  actorId: number,
  action: string,
  entityType: string,
  entityId: number,
  details?: Prisma.InputJsonValue,
): Promise<void> {
  await prisma.activityLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      details,
    },
  });
}
