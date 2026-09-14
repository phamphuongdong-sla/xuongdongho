'use server';

import { prisma } from '@/lib/prisma';

export async function getInventoryData(filters?: {
  unitId?: number;
  itemType?: 'all' | 'meter' | 'spare_part';
  status?: string;
  search?: string;
}) {
  const where: any = {};

  if (filters?.unitId) {
    where.unitId = filters.unitId;
  }

  if (filters?.itemType === 'meter') {
    where.meterId = { not: null };
  } else if (filters?.itemType === 'spare_part') {
    where.sparePartId = { not: null };
  }

  if (filters?.status && filters.status !== 'all') {
    where.status = filters.status;
  }

  const [units, inventories, alerts] = await Promise.all([
    prisma.unit.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.inventory.findMany({
      where,
      include: {
        unit: true,
        meter: true,
        sparePart: true,
      },
      orderBy: [
        { unit: { code: 'asc' } },
        { quantity: 'desc' },
      ],
    }),
    prisma.alert.findMany({
      include: { unit: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  // If search query is provided, filter in memory
  let filtered = inventories;
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = inventories.filter((inv) => {
      const meterMatch = inv.meter && (inv.meter.code.toLowerCase().includes(q) || inv.meter.name.toLowerCase().includes(q));
      const partMatch = inv.sparePart && (inv.sparePart.code.toLowerCase().includes(q) || inv.sparePart.name.toLowerCase().includes(q));
      const unitMatch = inv.unit.name.toLowerCase().includes(q) || inv.unit.code.toLowerCase().includes(q);
      return meterMatch || partMatch || unitMatch;
    });
  }

  return {
    units,
    inventories: filtered,
    alerts,
  };
}
