import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

export async function logActivity(
  actorId: number,
  action: string,
  entityType: string,
  entityId: number,
  details?: Prisma.InputJsonValue,
): Promise<void> {
  await prisma.audit_logs.create({
    data: {
      user_id: actorId,
      action,
      module: entityType,
      description: JSON.stringify({ entityId, details }),
    },
  });
}
