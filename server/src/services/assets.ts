import { prisma } from "../lib/prisma";
import { logActivity } from "../lib/logActivity";
import { AppError } from "../lib/AppError";
import type { AssetStatus } from "@prisma/client";

export async function getAssets(filters: {
  q?: string;
  category?: string;
  status?: string;
  location?: string;
}) {
  const where: any = {};

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q } },
      { assetTag: { contains: filters.q } },
      { serialNumber: { contains: filters.q } }
    ];
  }

  if (filters.category && filters.category !== "All") {
    where.category = { name: filters.category };
  }

  if (filters.status && filters.status !== "All") {
    where.status = filters.status as AssetStatus;
  }

  if (filters.location) {
    where.location = { contains: filters.location };
  }

  const assets = await prisma.asset.findMany({
    where,
    include: {
      category: true
    },
    orderBy: {
      id: "desc"
    }
  });

  return assets.map(a => ({
    id: a.id,
    assetTag: a.assetTag,
    name: a.name,
    category: a.category.name,
    categoryId: a.categoryId,
    serialNumber: a.serialNumber ?? "",
    location: a.location ?? "",
    status: a.status,
    condition: a.condition ?? "GOOD",
    acquisitionDate: a.acquisitionDate ? a.acquisitionDate.toISOString().split('T')[0] : "",
    acquisitionCost: a.acquisitionCost ? Number(a.acquisitionCost) : 0,
    isBookable: a.isBookable,
    photoUrl: a.photoUrl ?? ""
  }));
}

export async function registerAsset(
  actorId: number,
  data: {
    name: string;
    category: string;
    serialNumber: string;
    location: string;
    condition: string;
    acquisitionDate?: string;
    acquisitionCost?: number;
    isBookable: boolean;
    photoUrl?: string;
  }
) {
  let category = await prisma.assetCategory.findFirst({
    where: { name: data.category }
  });

  if (!category) {
    category = await prisma.assetCategory.create({
      data: { name: data.category }
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    const tempTag = `TEMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const asset = await tx.asset.create({
      data: {
        assetTag: tempTag,
        name: data.name,
        categoryId: category!.id,
        serialNumber: data.serialNumber || null,
        location: data.location || null,
        condition: data.condition || "GOOD",
        acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : null,
        acquisitionCost: data.acquisitionCost !== undefined && data.acquisitionCost !== null ? data.acquisitionCost : null,
        isBookable: data.isBookable,
        status: "AVAILABLE"
      }
    });

    const tag = `AF-${String(asset.id).padStart(4, "0")}`;
    const updatedAsset = await tx.asset.update({
      where: { id: asset.id },
      data: { assetTag: tag },
      include: { category: true }
    });

    return updatedAsset;
  });

  await logActivity(actorId, "REGISTER_ASSET", "ASSET", result.id, {
    name: result.name,
    tag: result.assetTag
  });

  return {
    id: result.id,
    assetTag: result.assetTag,
    name: result.name,
    category: result.category.name,
    categoryId: result.categoryId,
    serialNumber: result.serialNumber ?? "",
    location: result.location ?? "",
    status: result.status,
    condition: result.condition ?? "GOOD",
    acquisitionDate: result.acquisitionDate ? result.acquisitionDate.toISOString().split('T')[0] : "",
    acquisitionCost: result.acquisitionCost ? Number(result.acquisitionCost) : 0,
    isBookable: result.isBookable,
    photoUrl: result.photoUrl ?? ""
  };
}
