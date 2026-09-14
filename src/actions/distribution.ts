'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { validateExportStock } from '@/services/inventory.service';
import { requireAuth, getSessionUser } from '@/lib/auth';

export async function getDistributionData() {
  const khoVp = await prisma.unit.findFirst({
    where: { OR: [{ code: 'KHO-VP' }, { type: 'Kho/Xưởng' }, { sortOrder: 0 }] },
  });
  if (!khoVp) throw new Error('Kho VP not found');

  const [units, meters, vpInventories, exportVouchers] = await Promise.all([
    prisma.unit.findMany({
      where: { id: { not: khoVp.id }, isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.meter.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    }),
    prisma.inventory.findMany({
      where: { unitId: khoVp.id, meterId: { not: null } },
      include: { meter: true },
    }),
    prisma.exportVoucher.findMany({
      where: { exportReason: 'unit_distribution' },
      include: {
        destinationUnit: true,
        details: {
          include: { meter: true },
        },
      },
      orderBy: { voucherDate: 'desc' },
      take: 50,
    }),
  ]);

  // Aggregate available stock at Kho VP by meterId and status ('new' vs 'circulating')
  const vpStock: Record<string, number> = {};
  for (const inv of vpInventories) {
    if (inv.meterId) {
      const key = `${inv.meterId}_${inv.status}`;
      vpStock[key] = (vpStock[key] || 0) + inv.quantity;
    }
  }

  // Short and clean unit names mapping
  const cleanedUnits = units.map((u) => {
    return {
      ...u,
      displayName: u.name,
    };
  });

  return {
    khoVpId: khoVp.id,
    units: cleanedUnits,
    meters: meters.map((m) => ({
      ...m,
      newStock: vpStock[`${m.id}_new`] || 0,
      circulatingStock: vpStock[`${m.id}_circulating`] || 0,
    })),
    exportVouchers,
    employees: await prisma.employee.findMany({
      orderBy: { fullName: 'asc' },
    }),
  };
}

export async function dispatchMultipleMetersToUnit(data: {
  destinationUnitId: number;
  items: Array<{
    meterId: number;
    meterStatus: 'new' | 'circulating';
    quantity: number;
    notes?: string;
  }>;
  delivererName?: string;
  receiverName?: string;
  notes?: string;
}) {
  const khoVp = await prisma.unit.findFirst({
    where: { OR: [{ code: 'KHO-VP' }, { type: 'Kho/Xưởng' }, { sortOrder: 0 }] },
  });
  if (!khoVp) throw new Error('Kho VP không tồn tại');
  const khoUser = await prisma.user.findFirst({ where: { role: 'kho' } });

  // 1. Validate all stock items first
  for (const item of data.items) {
    if (item.quantity <= 0) continue;

    const inv = await prisma.inventory.findFirst({
      where: {
        unitId: khoVp.id,
        meterId: item.meterId,
        status: item.meterStatus,
      },
    });

    const availableStock = inv?.quantity || 0;
    const validation = validateExportStock({
      availableStock,
      requestedQuantity: item.quantity,
    });

    if (!validation.allowed) {
      const meterInfo = await prisma.meter.findUnique({ where: { id: item.meterId } });
      const statusLabel = item.meterStatus === 'new' ? 'Mới 100%' : 'Quay vòng';
      throw new Error(
        `Không đủ tồn kho tại Kho VP cho ${meterInfo?.name} (${statusLabel}). Tồn hiện tại: ${availableStock}, Yêu cầu: ${item.quantity}.`
      );
    }
  }

  const year = new Date().getFullYear();
  const count = await prisma.exportVoucher.count();
  const code = `PXK-${year}-${String(count + 1).padStart(4, '0')}`;

  let totalAmount = 0;

  await prisma.$transaction(async (tx) => {
    // A. Create Export Voucher Header
    const voucher = await tx.exportVoucher.create({
      data: {
        code,
        voucherDate: new Date(),
        exportReason: 'unit_distribution',
        unitId: khoVp.id,
        destinationUnitId: data.destinationUnitId,
        delivererName: data.delivererName || 'Nguyễn Văn Tiến',
        receiverName: data.receiverName || 'Đại diện đơn vị',
        createdBy: khoUser?.id || 1,
        status: 'completed',
        totalAmount: 0, // will update
        notes: data.notes || 'Xuất cấp đồng hồ cho đơn vị',
      },
    });

    // B. Process details
    for (const item of data.items) {
      if (item.quantity <= 0) continue;

      const meter = await tx.meter.findUnique({ where: { id: item.meterId } });
      const unitPrice = (item.meterStatus === 'new') ? (meter?.unitPrice || 350000) : (meter?.depreciationPrice || 120000);
      const lineAmount = item.quantity * unitPrice;
      totalAmount += lineAmount;

      await tx.exportVoucherDetail.create({
        data: {
          exportVoucherId: voucher.id,
          meterId: item.meterId,
          quantity: item.quantity,
          unitPrice,
          lineAmount,
          status: item.meterStatus,
          notes: item.notes || 'Cấp phát cho đơn vị nhận',
        },
      });

      // Decrement Kho VP Inventory
      await tx.inventory.updateMany({
        where: {
          unitId: khoVp.id,
          meterId: item.meterId,
          status: item.meterStatus,
        },
        data: { quantity: { decrement: item.quantity } },
      });

      // Increment Destination Unit Inventory
      const destInv = await tx.inventory.findFirst({
        where: {
          unitId: data.destinationUnitId,
          meterId: item.meterId,
          status: item.meterStatus,
        },
      });

      if (destInv) {
        await tx.inventory.update({
          where: { id: destInv.id },
          data: { quantity: { increment: item.quantity } },
        });
      } else {
        await tx.inventory.create({
          data: {
            unitId: data.destinationUnitId,
            meterId: item.meterId,
            quantity: item.quantity,
            status: item.meterStatus,
          },
        });
      }
    }

    // Update total amount on voucher
    await tx.exportVoucher.update({
      where: { id: voucher.id },
      data: { totalAmount },
    });
  });

  revalidatePath('/distribution');
  revalidatePath('/inventory');
  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  revalidatePath('/');
  return { success: true, code };
}

export async function deleteExportVoucher(id: number) {
  await requireAuth(['admin', 'kho']);
  await prisma.$transaction(async (tx) => {
    const voucher = await tx.exportVoucher.findUnique({
      where: { id },
      include: { details: true },
    });
    if (!voucher) throw new Error('Phiếu xuất không tồn tại');

    // Check destination unit stock before reverting
    if (voucher.destinationUnitId) {
      for (const d of voucher.details) {
        if (d.meterId) {
          const destInv = await tx.inventory.findFirst({
            where: { unitId: voucher.destinationUnitId, meterId: d.meterId, status: d.status },
          });
          const availableAtDest = destInv?.quantity || 0;
          if (availableAtDest < d.quantity) {
            const meter = await tx.meter.findUnique({ where: { id: d.meterId } });
            const destUnit = await tx.unit.findUnique({ where: { id: voucher.destinationUnitId } });
            throw new Error(
              `Không thể xóa phiếu xuất: Đơn vị tiếp nhận "${destUnit?.name || voucher.destinationUnitId}" không còn đủ tồn kho đồng hồ "${meter?.name || d.meterId}" (Tồn hiện tại: ${availableAtDest}, yêu cầu thu hồi: ${d.quantity}).`
            );
          }
        }
      }
    }

    // Revert inventory for each detail
    for (const d of voucher.details) {
      if (d.meterId) {
        // 1. Add back to Kho VP
        await tx.inventory.updateMany({
          where: { unitId: voucher.unitId, meterId: d.meterId, status: d.status },
          data: { quantity: { increment: d.quantity } },
        });

        // 2. Decrement from destination unit
        if (voucher.destinationUnitId) {
          await tx.inventory.updateMany({
            where: { unitId: voucher.destinationUnitId, meterId: d.meterId, status: d.status },
            data: { quantity: { decrement: d.quantity } },
          });
        }
      }
    }

    await tx.exportVoucherDetail.deleteMany({ where: { exportVoucherId: id } });
    await tx.exportVoucher.delete({ where: { id } });
  });

  revalidatePath('/distribution');
  revalidatePath('/inventory');
  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  revalidatePath('/');
  return { success: true };
}

export async function updateExportVoucher(
  id: number,
  data: {
    destinationUnitId?: number;
    voucherDate?: string;
    delivererName?: string;
    receiverName?: string;
    notes?: string;
    items?: Array<{
      meterId: number;
      meterStatus: 'new' | 'circulating';
      quantity: number;
      notes?: string;
    }>;
  }
) {
  await requireAuth(['admin', 'kho']);

  const khoVp = await prisma.unit.findFirst({
    where: { OR: [{ code: 'KHO-VP' }, { type: 'Kho/Xưởng' }, { sortOrder: 0 }] },
  });
  if (!khoVp) throw new Error('Kho VP không tồn tại');

  const existing = await prisma.exportVoucher.findUnique({
    where: { id },
    include: { details: true },
  });
  if (!existing) throw new Error('Phiếu xuất không tồn tại');

  await prisma.$transaction(async (tx) => {
    if (data.items && data.items.length > 0) {
      // 1. Revert previous inventory movements
      for (const d of existing.details) {
        if (d.meterId) {
          // Add back to Kho VP
          await tx.inventory.updateMany({
            where: { unitId: existing.unitId, meterId: d.meterId, status: d.status },
            data: { quantity: { increment: d.quantity } },
          });
          // Decrement from previous destination unit
          if (existing.destinationUnitId) {
            await tx.inventory.updateMany({
              where: { unitId: existing.destinationUnitId, meterId: d.meterId, status: d.status },
              data: { quantity: { decrement: d.quantity } },
            });
          }
        }
      }

      // 2. Validate stock constraints for new items
      const targetUnitId = data.destinationUnitId !== undefined ? data.destinationUnitId : existing.destinationUnitId;
      for (const item of data.items) {
        if (item.quantity <= 0) continue;
        const currentInv = await tx.inventory.findFirst({
          where: { unitId: khoVp.id, meterId: item.meterId, status: item.meterStatus },
        });
        const currentStock = currentInv?.quantity || 0;
        if (item.quantity > currentStock) {
          const meter = await tx.meter.findUnique({ where: { id: item.meterId } });
          throw new Error(`Không đủ tồn kho tại Kho VP cho ${meter?.name} (${item.meterStatus}). Tồn: ${currentStock}, Yêu cầu: ${item.quantity}.`);
        }
      }

      // 3. Delete old details and recreate
      await tx.exportVoucherDetail.deleteMany({ where: { exportVoucherId: id } });

      for (const item of data.items) {
        if (item.quantity <= 0) continue;

        await tx.exportVoucherDetail.create({
          data: {
            exportVoucherId: id,
            meterId: item.meterId,
            quantity: item.quantity,
            status: item.meterStatus,
            notes: item.notes || 'Cấp phát cho đơn vị nhận',
          },
        });

        // Decrement Kho VP
        await tx.inventory.updateMany({
          where: { unitId: khoVp.id, meterId: item.meterId, status: item.meterStatus },
          data: { quantity: { decrement: item.quantity } },
        });

        // Increment destination unit
        if (targetUnitId) {
          const destInv = await tx.inventory.findFirst({
            where: { unitId: targetUnitId, meterId: item.meterId, status: item.meterStatus },
          });
          if (destInv) {
            await tx.inventory.update({
              where: { id: destInv.id },
              data: { quantity: { increment: item.quantity } },
            });
          } else {
            await tx.inventory.create({
              data: {
                unitId: targetUnitId,
                meterId: item.meterId,
                quantity: item.quantity,
                status: item.meterStatus,
              },
            });
          }
        }
      }
    }

    // 4. Update voucher header
    await tx.exportVoucher.update({
      where: { id },
      data: {
        destinationUnitId: data.destinationUnitId !== undefined ? data.destinationUnitId : existing.destinationUnitId,
        voucherDate: data.voucherDate ? new Date(data.voucherDate) : existing.voucherDate,
        delivererName: data.delivererName !== undefined ? data.delivererName : existing.delivererName,
        receiverName: data.receiverName !== undefined ? data.receiverName : existing.receiverName,
        notes: data.notes !== undefined ? data.notes : existing.notes,
      },
    });
  });

  revalidatePath('/distribution');
  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  revalidatePath('/');
  return { success: true };
}

export async function updateExportVoucherNotes(id: number, notes: string) {
  await requireAuth(['admin', 'kho']);
  const voucher = await prisma.exportVoucher.update({
    where: { id },
    data: { notes },
  });
  revalidatePath('/distribution');
  return { success: true, voucher };
}
