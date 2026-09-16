'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, getSessionUser } from '@/lib/auth';

export async function getUsedMetersData() {
  const khoVp = await prisma.unit.findFirst({
    where: { OR: [{ code: 'KHO-VP' }, { type: 'Kho/Xưởng' }, { sortOrder: 0 }] },
  });
  if (!khoVp) throw new Error('Kho VP không tồn tại');

  const [units, meters, employees, vouchers, inventories, user] = await Promise.all([
    prisma.unit.findMany({
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.meter.findMany({
      where: {
        isActive: true,
        code: { not: 'ĐH015(SC)-DV' },
      },
      orderBy: { code: 'asc' },
    }),
    prisma.employee.findMany({
      where: { isActive: true },
      include: { unit: true },
      orderBy: { fullName: 'asc' },
    }),
    prisma.importVoucher.findMany({
      where: {
        OR: [
          { importReason: 'old_meters_return' },
          { importReason: 'repair_return' },
        ],
      },
      include: {
        sourceUnit: true,
        unit: true,
        user: true,
        details: {
          include: { meter: true },
        },
      },
      orderBy: { voucherDate: 'desc' },
      take: 100,
    }),
    prisma.inventory.findMany({
      where: {
        unitId: khoVp.id,
        status: 'sent_for_repair',
      },
      include: { meter: true },
    }),
    getSessionUser(),
  ]);

  const waitingStockMap: Record<number, number> = {};
  for (const inv of inventories) {
    if (inv.meterId) {
      waitingStockMap[inv.meterId] = inv.quantity;
    }
  }

  return {
    khoVpId: khoVp.id,
    units,
    meters: meters.map((m) => ({
      ...m,
      waitingStock: waitingStockMap[m.id] ?? 0,
    })),
    employees,
    vouchers: vouchers.map((v) => ({
      id: v.id,
      code: v.code,
      voucherDate: v.voucherDate.toISOString(),
      importReason: v.importReason,
      sourceUnitId: v.sourceUnitId,
      sourceUnitName: v.sourceUnit?.name || 'Đơn vị chuyển về',
      sourceUnitCode: v.sourceUnit?.code || '',
      unitId: v.unitId,
      delivererName: v.delivererName || '',
      receiverName: v.receiverName || '',
      technicianName: v.technicianName || 'Bùi Đức Duy',
      createdBy: v.createdBy,
      creatorName: v.user?.fullName || 'Hệ thống',
      status: v.status,
      notes: v.notes || '',
      totalQuantity: v.details.reduce((sum, d) => sum + d.quantity, 0),
      items: v.details.map((d) => ({
        id: d.id,
        meterId: d.meterId,
        meterCode: d.meter?.code || '',
        meterName: d.meter?.name || '',
        meterUnit: d.meter?.unit || 'Cái',
        quantity: d.quantity,
        status: d.status,
        notes: d.notes || '',
      })),
    })),
    currentUser: user,
  };
}

export async function createUsedMeterVoucher(data: {
  sourceUnitId: number;
  voucherDate: string;
  delivererName?: string;
  receiverName?: string;
  technicianName?: string;
  notes?: string;
  items: Array<{ meterId: number; quantity: number; notes?: string }>;
}) {
  const user = await requireAuth(['admin', 'kho']);

  const khoVp = await prisma.unit.findFirst({
    where: { OR: [{ code: 'KHO-VP' }, { type: 'Kho/Xưởng' }, { sortOrder: 0 }] },
  });
  if (!khoVp) throw new Error('Kho VP không tồn tại');

  if (!data.items || data.items.length === 0) {
    throw new Error('Vui lòng chọn ít nhất 1 loại đồng hồ cũ nhận về.');
  }

  const validItems = data.items.filter((i) => i.quantity > 0 && i.meterId);
  if (validItems.length === 0) {
    throw new Error('Số lượng đồng hồ nhận về phải lớn hơn 0.');
  }

  const year = new Date(data.voucherDate || new Date()).getFullYear();
  const count = await prisma.importVoucher.count({
    where: {
      code: { startsWith: `PNC-${year}-` },
    },
  });
  const code = `PNC-${year}-${String(count + 1).padStart(4, '0')}`;

  const result = await prisma.$transaction(async (tx) => {
    const voucher = await tx.importVoucher.create({
      data: {
        code,
        voucherDate: new Date(data.voucherDate),
        importReason: 'old_meters_return',
        unitId: khoVp.id,
        sourceUnitId: data.sourceUnitId,
        delivererName: data.delivererName || null,
        receiverName: data.receiverName || null,
        technicianName: data.technicianName || 'Bùi Đức Duy',
        createdBy: user.id,
        status: 'completed',
        notes: data.notes || 'Nhập kho đồng hồ cũ gửi về xưởng để kiểm tra & sửa chữa',
        details: {
          create: validItems.map((item) => ({
            meterId: item.meterId,
            quantity: item.quantity,
            status: 'sent_for_repair',
            notes: item.notes || 'Chờ kiểm tra & sửa chữa',
          })),
        },
      },
    });

    // Increment waiting repair inventory at KHO-VP
    for (const item of validItems) {
      await tx.inventory.upsert({
        where: {
          unitId_meterId_status: {
            unitId: khoVp.id,
            meterId: item.meterId,
            status: 'sent_for_repair',
          },
        },
        create: {
          unitId: khoVp.id,
          meterId: item.meterId,
          status: 'sent_for_repair',
          quantity: item.quantity,
        },
        update: {
          quantity: { increment: item.quantity },
        },
      });
    }

    return voucher;
  });

  revalidatePath('/used-meters');
  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  revalidatePath('/repairs');

  return { success: true, voucher: result };
}

export async function updateUsedMeterVoucher(
  voucherId: number,
  data: {
    code?: string;
    sourceUnitId?: number;
    voucherDate?: string;
    delivererName?: string;
    receiverName?: string;
    technicianName?: string;
    notes?: string;
    items?: Array<{ meterId: number; quantity: number; notes?: string }>;
  }
) {
  await requireAuth(['admin', 'kho']);

  const khoVp = await prisma.unit.findFirst({
    where: { OR: [{ code: 'KHO-VP' }, { type: 'Kho/Xưởng' }, { sortOrder: 0 }] },
  });
  if (!khoVp) throw new Error('Kho VP không tồn tại');

  const existing = await prisma.importVoucher.findUnique({
    where: { id: voucherId },
    include: { details: true },
  });
  if (!existing) throw new Error('Không tìm thấy phiếu nhập');

  if (data.code && data.code.trim() !== existing.code) {
    const duplicate = await prisma.importVoucher.findUnique({
      where: { code: data.code.trim() },
    });
    if (duplicate) {
      throw new Error(`Số phiếu "${data.code.trim()}" đã được sử dụng.`);
    }
  }

  await prisma.$transaction(async (tx) => {
    // 1. Revert previous inventory increments
    for (const oldDetail of existing.details) {
      if (oldDetail.meterId) {
        await tx.inventory.updateMany({
          where: {
            unitId: khoVp.id,
            meterId: oldDetail.meterId,
            status: 'sent_for_repair',
          },
          data: {
            quantity: { decrement: oldDetail.quantity },
          },
        });
      }
    }

    // 2. Delete existing details if new items provided
    if (data.items && data.items.length > 0) {
      await tx.importVoucherDetail.deleteMany({
        where: { importVoucherId: voucherId },
      });

      const validItems = data.items.filter((i) => i.quantity > 0 && i.meterId);
      for (const item of validItems) {
        await tx.importVoucherDetail.create({
          data: {
            importVoucherId: voucherId,
            meterId: item.meterId,
            quantity: item.quantity,
            status: 'sent_for_repair',
            notes: item.notes || 'Chờ kiểm tra & sửa chữa',
          },
        });

        await tx.inventory.upsert({
          where: {
            unitId_meterId_status: {
              unitId: khoVp.id,
              meterId: item.meterId,
              status: 'sent_for_repair',
            },
          },
          create: {
            unitId: khoVp.id,
            meterId: item.meterId,
            status: 'sent_for_repair',
            quantity: item.quantity,
          },
          update: {
            quantity: { increment: item.quantity },
          },
        });
      }
    }

    // 3. Update voucher metadata
    await tx.importVoucher.update({
      where: { id: voucherId },
      data: {
        code: data.code?.trim() || existing.code,
        sourceUnitId: data.sourceUnitId !== undefined ? data.sourceUnitId : existing.sourceUnitId,
        voucherDate: data.voucherDate ? new Date(data.voucherDate) : existing.voucherDate,
        delivererName: data.delivererName !== undefined ? data.delivererName : existing.delivererName,
        receiverName: data.receiverName !== undefined ? data.receiverName : existing.receiverName,
        technicianName: data.technicianName !== undefined ? data.technicianName : existing.technicianName,
        notes: data.notes !== undefined ? data.notes : existing.notes,
      },
    });
  });

  revalidatePath('/used-meters');
  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  revalidatePath('/repairs');

  return { success: true };
}

export async function deleteUsedMeterVoucher(voucherId: number) {
  await requireAuth(['admin', 'kho']);

  const khoVp = await prisma.unit.findFirst({
    where: { OR: [{ code: 'KHO-VP' }, { type: 'Kho/Xưởng' }, { sortOrder: 0 }] },
  });
  if (!khoVp) throw new Error('Kho VP không tồn tại');

  const existing = await prisma.importVoucher.findUnique({
    where: { id: voucherId },
    include: { details: true },
  });
  if (!existing) throw new Error('Không tìm thấy phiếu nhập');

  await prisma.$transaction(async (tx) => {
    // Check if waiting meters are still in stock (have not been consumed by repairs)
    for (const det of existing.details) {
      if (det.meterId) {
        const inv = await tx.inventory.findFirst({
          where: {
            unitId: khoVp.id,
            meterId: det.meterId,
            status: 'sent_for_repair',
          },
        });
        const availableWaiting = inv?.quantity || 0;
        if (availableWaiting < det.quantity) {
          const meter = await tx.meter.findUnique({ where: { id: det.meterId } });
          throw new Error(
            `Không thể xóa phiếu thu hồi: Đồng hồ cũ "${meter?.name || det.meterId}" đã được đưa vào xưởng sửa chữa (Tồn chờ sửa hiện tại: ${availableWaiting}, yêu cầu giảm: ${det.quantity}).`
          );
        }
      }
    }

    for (const det of existing.details) {
      if (det.meterId) {
        await tx.inventory.updateMany({
          where: {
            unitId: khoVp.id,
            meterId: det.meterId,
            status: 'sent_for_repair',
          },
          data: {
            quantity: { decrement: det.quantity },
          },
        });
      }
    }

    await tx.importVoucherDetail.deleteMany({ where: { importVoucherId: voucherId } });
    await tx.importVoucher.delete({ where: { id: voucherId } });
  });

  revalidatePath('/used-meters');
  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  revalidatePath('/repairs');

  return { success: true };
}
