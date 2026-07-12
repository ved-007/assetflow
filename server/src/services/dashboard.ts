import { prisma } from '../lib/prisma';
import { AssetStatus } from '@prisma/client';

export async function getDashboardKPIs() {
  const totalAssets = await prisma.asset.count({
    where: { status: { notIn: [AssetStatus.RETIRED, AssetStatus.DISPOSED] } }
  });
  
  const allocated = await prisma.asset.count({
    where: { status: AssetStatus.ALLOCATED }
  });
  
  const underMaintenance = await prisma.asset.count({
    where: { status: AssetStatus.UNDER_MAINTENANCE }
  });

  const available = await prisma.asset.count({
    where: { status: AssetStatus.AVAILABLE }
  });

  return {
    totalAssets,
    allocated,
    underMaintenance,
    available,
  };
}
