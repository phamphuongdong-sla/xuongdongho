'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { validateExportStock } from '@/services/inventory.service';
import { requireAuth, getSessionUser } from '@/lib/auth';

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore when static generation store or request context is missing
  }
}

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
    const destUnit = await tx.unit.findUnique({ where: { id: data.destinationUnitId } });
    const defaultDeliverer = destUnit?.name || 'Đại diện đơn vị';

    const voucher = await tx.exportVoucher.create({
      data: {
        code,
        voucherDate: new Date(),
        exportReason: 'unit_distribution',
        unitId: khoVp.id,
        destinationUnitId: data.destinationUnitId,
        delivererName: data.delivererName || defaultDeliverer,
        receiverName: data.receiverName || 'Nguyễn Văn Tiến',
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

  try {
    revalidatePath('/distribution');
    revalidatePath('/');
  } catch (e) {
    // Ignore
  }
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

  try {
    revalidatePath('/distribution');
    revalidatePath('/');
  } catch (e) {
    // Ignore
  }
  return { success: true };
}

export async function updateExportVoucher(
  id: number,
  data: {
    code?: string;
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
): Promise<{ success: true; voucher: any } | { success: false; error: string }> {
  try {
    await requireAuth(['admin', 'kho']);

    const khoVp = await prisma.unit.findFirst({
      where: { OR: [{ code: 'KHO-VP' }, { type: 'Kho/Xưởng' }, { sortOrder: 0 }] },
    });
    if (!khoVp) return { success: false, error: 'Kho VP không tồn tại' };

    const existing = await prisma.exportVoucher.findUnique({
      where: { id },
      include: { details: true },
    });
    if (!existing) return { success: false, error: 'Phiếu xuất không tồn tại' };

    // Validate voucher code uniqueness if changed
    if (data.code && data.code.trim() !== existing.code) {
      const duplicate = await prisma.exportVoucher.findUnique({
        where: { code: data.code.trim() },
      });
      if (duplicate) {
        return { success: false, error: `Số phiếu "${data.code.trim()}" đã được sử dụng.` };
      }
    }

    await prisma.$transaction(async (tx) => {
      let newTotalAmount = existing.totalAmount;
      const targetUnitId = data.destinationUnitId !== undefined ? data.destinationUnitId : existing.destinationUnitId;

      if (data.items && data.items.length > 0) {
        newTotalAmount = 0;

        // Helper function to safely adjust inventory with upsert
        const adjustInv = async (unitId: number, meterId: number, status: string, delta: number) => {
          if (delta === 0) return;
          const inv = await tx.inventory.findFirst({
            where: { unitId, meterId, status },
          });
          if (inv) {
            await tx.inventory.update({
              where: { id: inv.id },
              data: { quantity: { increment: delta } },
            });
          } else {
            await tx.inventory.create({
              data: {
                unitId,
                meterId,
                status,
                quantity: Math.max(0, delta),
              },
            });
          }
        };

        // 1. Build maps of old vs new usage: key = `${meterId}_${status}`
        const oldUsage = new Map<string, { meterId: number; status: string; quantity: number }>();
        for (const d of existing.details) {
          if (d.meterId) {
            const key = `${d.meterId}_${d.status}`;
            const current = oldUsage.get(key) || { meterId: d.meterId, status: d.status, quantity: 0 };
            current.quantity += d.quantity;
            oldUsage.set(key, current);
          }
        }

        const newUsage = new Map<string, { meterId: number; status: string; quantity: number }>();
        for (const item of data.items) {
          if (item.quantity <= 0) continue;
          const key = `${item.meterId}_${item.meterStatus}`;
          const current = newUsage.get(key) || { meterId: item.meterId, status: item.meterStatus, quantity: 0 };
          current.quantity += item.quantity;
          newUsage.set(key, current);
        }

        const allKeys = new Set([...oldUsage.keys(), ...newUsage.keys()]);

        // 2. Adjust Kho VP inventory based on net delta
        for (const key of allKeys) {
          const oldItem = oldUsage.get(key);
          const newItem = newUsage.get(key);
          const meterId = newItem?.meterId || oldItem!.meterId;
          const status = newItem?.status || oldItem!.status;
          const oldQ = oldItem?.quantity || 0;
          const newQ = newItem?.quantity || 0;
          const deltaExport = newQ - oldQ; // Positive = exporting more, Negative = returning stock

          if (deltaExport > 0) {
            // Exporting more: check if Kho VP has enough additional stock
            const khoInv = await tx.inventory.findFirst({
              where: { unitId: khoVp.id, meterId, status },
            });
            const availableStock = khoInv?.quantity || 0;
            if (availableStock < deltaExport) {
              const meter = await tx.meter.findUnique({ where: { id: meterId } });
              throw new Error(
                `Không đủ tồn kho bổ sung tại Kho VP cho ${meter?.name} (${status}). Yêu cầu xuất thêm: ${deltaExport}, tồn khả dụng: ${availableStock}.`
              );
            }
            await adjustInv(khoVp.id, meterId, status, -deltaExport);
          } else if (deltaExport < 0) {
            // Exporting less: return difference to Kho VP
            await adjustInv(khoVp.id, meterId, status, Math.abs(deltaExport));
          }

          // 3. Adjust destination unit
          if (targetUnitId === existing.destinationUnitId) {
            if (targetUnitId && deltaExport !== 0) {
              await adjustInv(targetUnitId, meterId, status, deltaExport);
            }
          } else {
            // Destination changed: remove all from old, add all to new
            if (existing.destinationUnitId && oldQ > 0) {
              await adjustInv(existing.destinationUnitId, meterId, status, -oldQ);
            }
            if (targetUnitId && newQ > 0) {
              await adjustInv(targetUnitId, meterId, status, newQ);
            }
          }
        }

        // 4. Delete old details and insert new details with pricing
        await tx.exportVoucherDetail.deleteMany({ where: { exportVoucherId: id } });

        for (const item of data.items) {
          if (item.quantity <= 0) continue;
          const meter = await tx.meter.findUnique({ where: { id: item.meterId } });
          const unitPrice = (item.meterStatus === 'new')
            ? (meter?.unitPrice || 350000)
            : (meter?.depreciationPrice || 120000);
          const lineAmount = item.quantity * unitPrice;
          newTotalAmount += lineAmount;

          await tx.exportVoucherDetail.create({
            data: {
              exportVoucherId: id,
              meterId: item.meterId,
              quantity: item.quantity,
              unitPrice,
              lineAmount,
              status: item.meterStatus,
              notes: item.notes || 'Cấp phát cho đơn vị nhận',
            },
          });
        }
      }

      // 5. Update voucher header
      await tx.exportVoucher.update({
        where: { id },
        data: {
          code: data.code?.trim() || existing.code,
          destinationUnitId: targetUnitId,
          voucherDate: data.voucherDate ? new Date(data.voucherDate) : existing.voucherDate,
          delivererName: data.delivererName !== undefined ? data.delivererName : existing.delivererName,
          receiverName: data.receiverName !== undefined ? data.receiverName : existing.receiverName,
          notes: data.notes !== undefined ? data.notes : existing.notes,
          totalAmount: newTotalAmount,
        },
      });
    });

    const updatedVoucher = await prisma.exportVoucher.findUnique({
      where: { id },
      include: {
        destinationUnit: true,
        details: {
          include: {
            meter: true,
          },
        },
      },
    });

    safeRevalidatePath('/distribution');
    safeRevalidatePath('/reports');
    safeRevalidatePath('/unit-reports');
    safeRevalidatePath('/');
    return { success: true, voucher: updatedVoucher };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi khi cập nhật phiếu xuất' };
  }
}

export async function updateExportVoucherNotes(id: number, notes: string) {
  await requireAuth(['admin', 'kho']);
  const voucher = await prisma.exportVoucher.update({
    where: { id },
    data: { notes },
  });
  safeRevalidatePath('/distribution');
  return { success: true, voucher };
}
