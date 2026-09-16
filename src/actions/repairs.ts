'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { validateRepairBOM } from '@/services/inventory.service';
import { requireAuth, getSessionUser } from '@/lib/auth';

export async function getRepairsData() {
  const khoVp = await prisma.unit.findFirst({
    where: { OR: [{ code: 'KHO-VP' }, { type: 'Kho/Xưởng' }, { sortOrder: 0 }] },
  });
  if (!khoVp) throw new Error('Kho VP not found');

  // ONLY repair meter models per Request 3 (chỉ nhận sửa đồng hồ từ DN50 trở xuống, không nhận ĐH sửa chữa đơn vị):
  const repairMeters = await prisma.meter.findMany({
    where: {
      AND: [
        { isActive: true },
        { code: { notIn: ['ĐH150-CTOR', 'ĐH015(SC)-DV'] } },
        { NOT: { code: { contains: '150' } } },
        { NOT: { name: { contains: '150' } } },
        { NOT: { name: { contains: 'đơn vị' } } },
        {
          OR: [
            { category: 'Sửa chữa' },
            { code: { contains: 'SC' } },
            { name: { contains: 'sửa chữa' } },
          ],
        },
      ],
    },
    orderBy: { code: 'asc' },
  });

  const [allMeters, spareParts, repairVouchers, vpNewStocks] = await Promise.all([
    prisma.meter.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    }),
    prisma.sparePart.findMany({
      where: { isActive: true },
      include: {
        inventories: {
          where: { unitId: khoVp.id, status: 'new' },
        },
      },
      orderBy: { code: 'asc' },
    }),
    prisma.repairVoucher.findMany({
      include: {
        meter: true,
        user: true,
        technician: true,
        sparePartUsages: {
          include: { sparePart: true },
        },
      },
      orderBy: { repairDate: 'desc' },
      take: 500,
    }),
    prisma.inventory.findMany({
      where: {
        unitId: khoVp.id,
        meterId: { not: null },
        status: 'new',
      },
    }),
  ]);

  // Map spare parts with available stock
  const partsWithStock = spareParts.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    category: p.category,
    unit: p.unit,
    unitPrice: p.unitPrice,
    availableStock: p.inventories[0]?.quantity ?? 0,
  }));

  // Fetch current waiting repair stock at KHO-VP
  const repairStocks = await prisma.inventory.findMany({
    where: {
      unitId: khoVp.id,
      status: 'sent_for_repair',
    },
  });

  const repairStockMap: Record<number, number> = {};
  for (const s of repairStocks) {
    if (s.meterId) repairStockMap[s.meterId] = s.quantity;
  }

  const vpNewStockMap: Record<number, number> = {};
  for (const s of vpNewStocks) {
    if (s.meterId) vpNewStockMap[s.meterId] = s.quantity;
  }

  return {
    khoVpId: khoVp.id,
    meters: repairMeters.map((m) => ({
      ...m,
      waitingRepairStock: repairStockMap[m.id] ?? 0,
    })),
    allMeters: allMeters.map((m) => ({
      ...m,
      newStock: vpNewStockMap[m.id] ?? 0,
    })),
    spareParts: partsWithStock,
    repairVouchers,
    employees: await prisma.employee.findMany({
      orderBy: { fullName: 'asc' },
    }),
  };
}

export async function submitRepairVoucher(data: {
  meterId: number;
  inputQuantity: number;
  completedQuantity: number;
  scrappedQuantity: number;
  notes?: string;
  partsUsed: Array<{ sparePartId: number; quantity: number }>;
  creatorName?: string;
  receiverName?: string;
  workshopManagerName?: string;
}): Promise<{ success: true; code: string } | { success: false; error: string }> {
  try {
    const user = await requireAuth(['admin', 'ktv', 'kho']);

    const khoVp = await prisma.unit.findFirst({
      where: { OR: [{ code: 'KHO-VP' }, { type: 'Kho/Xưởng' }, { sortOrder: 0 }] },
    });
    if (!khoVp) return { success: false, error: 'Kho VP không tồn tại' };

    // 1. Validate meter eligibility (chỉ sửa đồng hồ từ DN50 trở xuống)
    const targetMeter = await prisma.meter.findUnique({ where: { id: data.meterId } });
    if (!targetMeter) return { success: false, error: 'Đồng hồ không tồn tại.' };
    if (
      targetMeter.code === 'ĐH150-CTOR' ||
      targetMeter.code.includes('150') ||
      targetMeter.name.toLowerCase().includes('150')
    ) {
      return {
        success: false,
        error: 'Xưởng chỉ sửa chữa các loại đồng hồ từ DN50 trở xuống. Không thể tạo phiếu sửa chữa cho đồng hồ DN150.',
      };
    }

    // 2. Validate total balance: inputQuantity >= completedQuantity + scrappedQuantity
    if (data.inputQuantity < data.completedQuantity + data.scrappedQuantity) {
      return {
        success: false,
        error: 'Số lượng hoàn thành + hỏng loại bỏ không được vượt quá số lượng nhận sửa.',
      };
    }

    // 3. Validate spare parts inventory constraints
    for (const p of data.partsUsed) {
      if (p.quantity <= 0) continue;
      const inv = await prisma.inventory.findFirst({
        where: {
          unitId: khoVp.id,
          sparePartId: p.sparePartId,
          status: 'new',
        },
      });
      const currentStock = inv?.quantity ?? 0;
      if (p.quantity > currentStock) {
        const partInfo = await prisma.sparePart.findUnique({ where: { id: p.sparePartId } });
        return {
          success: false,
          error: `Không đủ tồn kho cho linh kiện ${partInfo?.name ?? p.sparePartId} (Tồn hiện tại: ${currentStock}, Yêu cầu xuất: ${p.quantity}).`,
        };
      }
    }

    // Generate code PSC-YYYY-XXXX
    const year = new Date().getFullYear();
    const count = await prisma.repairVoucher.count();
    const code = `PSC-${year}-${String(count + 1).padStart(4, '0')}`;

    // Execute Transaction
    await prisma.$transaction(async (tx) => {
      // A. Create repair voucher
      const voucher = await tx.repairVoucher.create({
        data: {
          code,
          repairDate: new Date(),
          workshopUnitId: khoVp.id,
          meterId: data.meterId,
          inputQuantity: data.inputQuantity,
          completedQuantity: data.completedQuantity,
          scrappedQuantity: data.scrappedQuantity,
          delivererName: data.creatorName || 'Lương Phương Thảo',
          receiverName: data.receiverName || 'Nguyễn Văn Tiến',
          createdBy: user.id,
          technicianId: user.role === 'ktv' ? user.id : user.id,
          status: 'completed',
          notes: data.notes || 'Sửa chữa và nhập kho quay vòng',
        },
      });

      // B. Deduct spare parts and record usage
      for (const p of data.partsUsed) {
        if (p.quantity <= 0) continue;
        const part = await tx.sparePart.findUnique({ where: { id: p.sparePartId } });
        const unitPrice = part?.unitPrice ?? 0;

        await tx.repairVoucherSparePart.create({
          data: {
            repairVoucherId: voucher.id,
            sparePartId: p.sparePartId,
            quantity: p.quantity,
            unitPrice,
          },
        });

        // Deduct inventory
        await tx.inventory.updateMany({
          where: {
            unitId: khoVp.id,
            sparePartId: p.sparePartId,
            status: 'new',
          },
          data: {
            quantity: { decrement: p.quantity },
          },
        });
      }

      // C. Adjust meter inventories:
      // Deduct from sent_for_repair if available
      const waitingInv = await tx.inventory.findFirst({
        where: { unitId: khoVp.id, meterId: data.meterId, status: 'sent_for_repair' },
      });
      if (waitingInv) {
        const deductQty = Math.min(waitingInv.quantity, data.inputQuantity);
        await tx.inventory.update({
          where: { id: waitingInv.id },
          data: { quantity: { decrement: deductQty } },
        });
      }

      // Increase completed meters to 'circulating' (đồng hồ xưởng sửa xong sẵn sàng cấp phát)
      if (data.completedQuantity > 0) {
        const circulatingInv = await tx.inventory.findFirst({
          where: { unitId: khoVp.id, meterId: data.meterId, status: 'circulating' },
        });
        if (circulatingInv) {
          await tx.inventory.update({
            where: { id: circulatingInv.id },
            data: { quantity: { increment: data.completedQuantity } },
          });
        } else {
          await tx.inventory.create({
            data: {
              unitId: khoVp.id,
              meterId: data.meterId,
              quantity: data.completedQuantity,
              status: 'circulating',
            },
          });
        }
      }

      // Increase scrapped meters to 'broken' (hỏng chờ thanh lý)
      if (data.scrappedQuantity > 0) {
        const brokenInv = await tx.inventory.findFirst({
          where: { unitId: khoVp.id, meterId: data.meterId, status: 'broken' },
        });
        if (brokenInv) {
          await tx.inventory.update({
            where: { id: brokenInv.id },
            data: { quantity: { increment: data.scrappedQuantity } },
          });
        } else {
          await tx.inventory.create({
            data: {
              unitId: khoVp.id,
              meterId: data.meterId,
              quantity: data.scrappedQuantity,
              status: 'broken',
            },
          });
        }
      }
    });

    try {
      revalidatePath('/repairs');
      revalidatePath('/');
    } catch (e) {
      // Ignore background revalidate errors on worker
    }
    return { success: true, code };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi hệ thống khi lập phiếu sửa chữa' };
  }
}

/**
 * Chỉnh sửa một phiếu sửa chữa đã hoàn tất. Tồn kho được hoàn trả theo dữ liệu
 * cũ trước khi trừ/nhập lại theo dữ liệu mới, vì vậy hai báo cáo NXT luôn lấy
 * đúng số liệu sau cùng của phiếu.
 */
export async function updateRepairVoucher(data: {
  id: number;
  code?: string;
  meterId: number;
  inputQuantity: number;
  completedQuantity: number;
  scrappedQuantity: number;
  notes?: string;
  partsUsed: Array<{ sparePartId: number; quantity: number }>;
  creatorName?: string;
  receiverName?: string;
  workshopManagerName?: string;
}): Promise<{ success: true; code: string } | { success: false; error: string }> {
  try {
    await requireAuth(['admin', 'ktv', 'kho']);
    if (data.inputQuantity <= 0) return { success: false, error: 'Số lượng nhận sửa phải lớn hơn 0.' };
    if (data.inputQuantity < data.completedQuantity + data.scrappedQuantity) {
      return {
        success: false,
        error: 'Số lượng hoàn thành + hỏng loại bỏ không được vượt quá số lượng nhận sửa.',
      };
    }

    const targetMeter = await prisma.meter.findUnique({ where: { id: data.meterId } });
    if (!targetMeter) return { success: false, error: 'Đồng hồ không tồn tại.' };
    if (
      targetMeter.code === 'ĐH150-CTOR' ||
      targetMeter.code.includes('150') ||
      targetMeter.name.toLowerCase().includes('150')
    ) {
      return {
        success: false,
        error: 'Xưởng chỉ sửa chữa các loại đồng hồ từ DN50 trở xuống. Không thể tạo phiếu sửa chữa cho đồng hồ DN150.',
      };
    }

    const voucher = await prisma.repairVoucher.findUnique({
      where: { id: data.id },
      include: { sparePartUsages: true },
    });
    if (!voucher) return { success: false, error: 'Phiếu sửa chữa không tồn tại.' };

    if (data.code && data.code.trim() !== voucher.code) {
      const duplicate = await prisma.repairVoucher.findUnique({
        where: { code: data.code.trim() },
      });
      if (duplicate) {
        return { success: false, error: `Số phiếu "${data.code.trim()}" đã được sử dụng.` };
      }
    }

    if (voucher.code.includes('BS') || voucher.notes?.includes('[Nguồn:')) {
      return {
        success: false,
        error: 'Phiếu xuất bổ sung phải được hoàn tác rồi lập lại để bảo toàn dấu vết kế hoạch.',
      };
    }

    const normalizedParts = Array.from(
      data.partsUsed.reduce((map, item) => {
        if (item.quantity > 0) map.set(item.sparePartId, (map.get(item.sparePartId) || 0) + item.quantity);
        return map;
      }, new Map<number, number>())
    ).map(([sparePartId, quantity]) => ({ sparePartId, quantity }));

    const khoVp = await prisma.unit.findFirst({
      where: { OR: [{ code: 'KHO-VP' }, { type: 'Kho/Xưởng' }, { sortOrder: 0 }] },
    });
    if (!khoVp) return { success: false, error: 'Kho VP không tồn tại' };

    // Kiểm tra theo tồn hiện có cộng số linh kiện mà phiếu cũ sẽ hoàn lại.
    const oldUsage = new Map<number, number>();
    voucher.sparePartUsages.forEach((u) => oldUsage.set(u.sparePartId, (oldUsage.get(u.sparePartId) || 0) + u.quantity));
    for (const part of normalizedParts) {
      const inventory = await prisma.inventory.findFirst({
        where: { unitId: khoVp.id, sparePartId: part.sparePartId, status: 'new' },
      });
      const availableAfterRevert = (inventory?.quantity || 0) + (oldUsage.get(part.sparePartId) || 0);
      if (part.quantity > availableAfterRevert) {
        const partInfo = await prisma.sparePart.findUnique({ where: { id: part.sparePartId } });
        return {
          success: false,
          error: `Không đủ tồn kho cho linh kiện ${partInfo?.name ?? part.sparePartId} (khả dụng sau hoàn phiếu: ${availableAfterRevert}).`,
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      // Hoàn ảnh hưởng của phiếu cũ.
      for (const old of voucher.sparePartUsages) {
        await tx.inventory.updateMany({
          where: { unitId: voucher.workshopUnitId, sparePartId: old.sparePartId, status: 'new' },
          data: { quantity: { increment: old.quantity } },
        });
      }
      if (voucher.completedQuantity) {
        await tx.inventory.updateMany({
          where: { unitId: voucher.workshopUnitId, meterId: voucher.meterId, status: 'circulating' },
          data: { quantity: { decrement: voucher.completedQuantity } },
        });
      }
      if (voucher.scrappedQuantity) {
        await tx.inventory.updateMany({
          where: { unitId: voucher.workshopUnitId, meterId: voucher.meterId, status: 'broken' },
          data: { quantity: { decrement: voucher.scrappedQuantity } },
        });
      }
      await tx.repairVoucherSparePart.deleteMany({ where: { repairVoucherId: voucher.id } });

      await tx.repairVoucher.update({
        where: { id: voucher.id },
        data: {
          code: data.code?.trim() || voucher.code,
          meterId: data.meterId,
          inputQuantity: data.inputQuantity,
          completedQuantity: data.completedQuantity,
          scrappedQuantity: data.scrappedQuantity,
          delivererName: data.creatorName || voucher.delivererName || 'Lương Phương Thảo',
          receiverName: data.receiverName || voucher.receiverName || 'Nguyễn Văn Tiến',
          notes: data.notes?.trim() || 'Sửa chữa và nhập kho quay vòng',
        },
      });

      // Áp dụng lại vật tư và tồn đồng hồ theo dữ liệu mới.
      for (const partUsage of normalizedParts) {
        const part = await tx.sparePart.findUnique({ where: { id: partUsage.sparePartId } });
        await tx.repairVoucherSparePart.create({
          data: {
            repairVoucherId: voucher.id,
            sparePartId: partUsage.sparePartId,
            quantity: partUsage.quantity,
            unitPrice: part?.unitPrice || 0,
          },
        });
        await tx.inventory.updateMany({
          where: { unitId: voucher.workshopUnitId, sparePartId: partUsage.sparePartId, status: 'new' },
          data: { quantity: { decrement: partUsage.quantity } },
        });
      }

      for (const [status, quantity] of [['circulating', data.completedQuantity], ['broken', data.scrappedQuantity]] as const) {
        if (!quantity) continue;
        const stock = await tx.inventory.findFirst({
          where: { unitId: voucher.workshopUnitId, meterId: data.meterId, status },
        });
        if (stock) {
          await tx.inventory.update({ where: { id: stock.id }, data: { quantity: { increment: quantity } } });
        } else {
          await tx.inventory.create({ data: { unitId: voucher.workshopUnitId, meterId: data.meterId, status, quantity } });
        }
      }
    });

    try {
      revalidatePath('/repairs');
      revalidatePath('/');
    } catch (e) {
      // Ignore background revalidate errors on worker
    }
    return { success: true, code: voucher.code };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi hệ thống khi cập nhật phiếu sửa chữa' };
  }
}

export async function submitSupplementRepairVoucher(data: {
  sourceMeterId: number;
  targetMeterId: number;
  quantity: number;
  notes?: string;
}): Promise<{ success: true; code: string } | { success: false; error: string }> {
  try {
    const user = await requireAuth(['admin', 'ktv', 'kho']);

    const khoVp = await prisma.unit.findFirst({
      where: { OR: [{ code: 'KHO-VP' }, { type: 'Kho/Xưởng' }, { sortOrder: 0 }] },
    });
    if (!khoVp) return { success: false, error: 'Kho VP không tồn tại' };

    if (data.quantity <= 0) {
      return { success: false, error: 'Số lượng bổ sung phải lớn hơn 0.' };
    }

    // Check new stock of sourceMeter at Kho VP
    const sourceInv = await prisma.inventory.findFirst({
      where: {
        unitId: khoVp.id,
        meterId: data.sourceMeterId,
        status: 'new',
      },
    });
    const availableNew = sourceInv?.quantity || 0;
    if (data.quantity > availableNew) {
      const sourceMeter = await prisma.meter.findUnique({ where: { id: data.sourceMeterId } });
      return {
        success: false,
        error: `Không đủ tồn kho ĐH Mới tại Kho VP cho ${sourceMeter?.name || data.sourceMeterId} (Tồn mới hiện tại: ${availableNew}, Yêu cầu xuất: ${data.quantity}).`,
      };
    }

    const year = new Date().getFullYear();
    const count = await prisma.repairVoucher.count();
    const code = `PSC-BS-${year}-${String(count + 1).padStart(4, '0')}`;
    const defaultNotes = 'Xuất bổ sung ĐH mới sang ĐH sửa chữa do thay đổi kế hoạch';
    const sourceMeter = await prisma.meter.findUnique({ where: { id: data.sourceMeterId } });
    const noteContent = data.notes?.trim() || defaultNotes;
    const fullNotes = `[Nguồn: ${sourceMeter?.code || data.sourceMeterId}] ${noteContent}`;

    await prisma.$transaction(async (tx) => {
      // 1. Decrement source meter new stock
      await tx.inventory.updateMany({
        where: {
          unitId: khoVp.id,
          meterId: data.sourceMeterId,
          status: 'new',
        },
        data: {
          quantity: { decrement: data.quantity },
        },
      });

      // 2. Increment target meter circulating stock
      const targetInv = await tx.inventory.findFirst({
        where: {
          unitId: khoVp.id,
          meterId: data.targetMeterId,
          status: 'circulating',
        },
      });
      if (targetInv) {
        await tx.inventory.update({
          where: { id: targetInv.id },
          data: { quantity: { increment: data.quantity } },
        });
      } else {
        await tx.inventory.create({
          data: {
            unitId: khoVp.id,
            meterId: data.targetMeterId,
            quantity: data.quantity,
            status: 'circulating',
          },
        });
      }

      // 3. Create Repair Voucher
      await tx.repairVoucher.create({
        data: {
          code,
          repairDate: new Date(),
          workshopUnitId: khoVp.id,
          meterId: data.targetMeterId,
          inputQuantity: data.quantity,
          completedQuantity: data.quantity,
          scrappedQuantity: 0,
          createdBy: user.id,
          technicianId: user.id,
          status: 'completed',
          notes: fullNotes,
        },
      });
    });

    try {
      revalidatePath('/repairs');
      revalidatePath('/');
    } catch (e) {
      // Ignore background revalidate errors on worker
    }
    return { success: true, code };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi hệ thống khi lập phiếu xuất bổ sung' };
  }
}

export async function deleteRepairVoucher(id: number): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireAuth(['admin', 'ktv', 'kho']);
    await prisma.$transaction(async (tx) => {
      const voucher = await tx.repairVoucher.findUnique({
        where: { id },
        include: { sparePartUsages: true },
      });
      if (!voucher) throw new Error('Phiếu sửa chữa không tồn tại');

      const isSupplement = voucher.code.includes('BS') || (voucher.notes && voucher.notes.includes('[Nguồn:'));
      if (isSupplement) {
        // Parse source meter ID or code from notes
        const match = voucher.notes?.match(/\[Nguồn:\s*([^\]]+)\]/);
        let sourceMeterId = voucher.meterId;
        if (match && match[1]) {
          const found = await tx.meter.findFirst({
            where: { OR: [{ code: match[1].trim() }, { id: parseInt(match[1].trim()) || 0 }] },
          });
          if (found) sourceMeterId = found.id;
        }

        // Check target circulating stock before decrementing
        const targetInv = await tx.inventory.findFirst({
          where: {
            unitId: voucher.workshopUnitId,
            meterId: voucher.meterId,
            status: 'circulating',
          },
        });
        const availableCirc = targetInv?.quantity || 0;
        if (availableCirc < voucher.completedQuantity) {
          const targetMeter = await tx.meter.findUnique({ where: { id: voucher.meterId } });
          throw new Error(
            `Không thể xóa phiếu sửa chữa bổ sung: Đồng hồ "${targetMeter?.name || voucher.meterId}" đã được cấp phát (Tồn quay vòng hiện tại: ${availableCirc}, yêu cầu giảm: ${voucher.completedQuantity}).`
          );
        }

        // Add back to source meter 'new'
        await tx.inventory.updateMany({
          where: {
            unitId: voucher.workshopUnitId,
            meterId: sourceMeterId,
            status: 'new',
          },
          data: { quantity: { increment: voucher.completedQuantity } },
        });

        // Decrement target meter 'circulating'
        await tx.inventory.updateMany({
          where: {
            unitId: voucher.workshopUnitId,
            meterId: voucher.meterId,
            status: 'circulating',
          },
          data: { quantity: { decrement: voucher.completedQuantity } },
        });

        await tx.repairVoucher.delete({ where: { id } });
        return;
      }

      // 1. Revert spare parts inventory (add back to Kho VP)
      for (const u of voucher.sparePartUsages) {
        await tx.inventory.updateMany({
          where: {
            unitId: voucher.workshopUnitId,
            sparePartId: u.sparePartId,
            status: 'new',
          },
          data: { quantity: { increment: u.quantity } },
        });
      }

      // 2. Revert circulating meter quantity (check available circulating stock first)
      if (voucher.completedQuantity > 0) {
        const circInv = await tx.inventory.findFirst({
          where: {
            unitId: voucher.workshopUnitId,
            meterId: voucher.meterId,
            status: 'circulating',
          },
        });
        const availableCirc = circInv?.quantity || 0;
        if (availableCirc < voucher.completedQuantity) {
          const meter = await tx.meter.findUnique({ where: { id: voucher.meterId } });
          throw new Error(
            `Không thể xóa phiếu sửa chữa: Đồng hồ hoàn thành "${meter?.name || voucher.meterId}" đã được cấp phát cho đơn vị (Tồn quay vòng hiện tại: ${availableCirc}, yêu cầu giảm: ${voucher.completedQuantity}).`
          );
        }

        await tx.inventory.updateMany({
          where: {
            unitId: voucher.workshopUnitId,
            meterId: voucher.meterId,
            status: 'circulating',
          },
          data: { quantity: { decrement: voucher.completedQuantity } },
        });
      }

      // 3. Revert broken meter quantity
      if (voucher.scrappedQuantity > 0) {
        await tx.inventory.updateMany({
          where: {
            unitId: voucher.workshopUnitId,
            meterId: voucher.meterId,
            status: 'broken',
          },
          data: { quantity: { decrement: voucher.scrappedQuantity } },
        });
      }

      // 4. Delete voucher
      await tx.repairVoucherSparePart.deleteMany({ where: { repairVoucherId: id } });
      await tx.repairVoucher.delete({ where: { id } });
    });

    try {
      revalidatePath('/repairs');
      revalidatePath('/');
    } catch (e) {
      // Ignore background revalidate errors on worker
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi hệ thống khi xóa phiếu sửa chữa' };
  }
}

export async function updateRepairVoucherNotes(
  id: number,
  notes: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireAuth(['admin', 'ktv', 'kho']);
    await prisma.repairVoucher.update({
      where: { id },
      data: { notes },
    });
    try {
      revalidatePath('/repairs');
    } catch (e) {
      // Ignore
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi hệ thống khi cập nhật ghi chú' };
  }
}
