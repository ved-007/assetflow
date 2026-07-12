import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../lib/AppError";
import { prisma } from "../lib/prisma";

export async function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): Promise<void> {
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002" &&
    (err.meta?.target as string[] | string | undefined)
      ?.toString()
      .includes("uq_one_active_allocation")
  ) {
    const assetId = req.body?.assetId;
    const activeAllocation = assetId
      ? await prisma.asset_assignments.findFirst({
          where: { asset_id: Number(assetId), return_date: null },
          include: { users_asset_assignments_user_idTousers: true },
        })
      : null;

    const holderName =
      activeAllocation?.users_asset_assignments_user_idTousers?.full_name ??
      "another employee";
    res
      .status(409)
      .json({
        ok: false,
        error: `This asset is currently held by ${holderName}`,
      });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({ ok: false, error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    const message = err.issues[0]?.message ?? "Invalid request data";
    res.status(400).json({ ok: false, error: message });
    return;
  }

  console.error(err);
  res
    .status(500)
    .json({ ok: false, error: "Something went wrong. Please try again." });
}
