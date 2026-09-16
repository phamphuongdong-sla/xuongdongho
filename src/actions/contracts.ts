'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, getSessionUser } from '@/lib/auth';

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore when static generation store or request context is missing
  }
}

export async function getContractsData() {
  const khoVp = await prisma.unit.findFirst({
    where: { OR: [{ code: 'KHO-VP' }, { type: 'Kho/Xưởng' }, { sortOrder: 0 }] },
  });
  if (!khoVp) throw new Error('Kho VP not found');

  const [contracts, meters, spareParts, importVouchers, employees] = await Promise.all([
    prisma.contract.findMany({
      include: {
        batches: {
          orderBy: { batchNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.meter.findMany({
      where: { category: { not: 'Sửa chữa' }, isActive: true }, // New and imported meters
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
    prisma.importVoucher.findMany({
      where: { contractId: { not: null } },
      include: {
        contract: true,
        batch: true,
        details: {
          include: { sparePart: true, meter: true },
        },
      },
      orderBy: { voucherDate: 'desc' },
    }),
    prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { fullName: 'asc' },
    }),
  ]);

  return {
    khoVpId: khoVp.id,
    contracts,
    meters,
    spareParts: spareParts.map((sp) => ({
      ...sp,
      currentStock: sp.inventories[0]?.quantity ?? 0,
    })),
    importVouchers,
    employees,
  };
}

export async function createContract(data: {
  contractNumber: string;
  title: string;
  supplierName: string;
  totalValue: number;
  signDate?: string;
  notes?: string;
}) {
  const contract = await prisma.contract.create({
    data: {
      contractNumber: data.contractNumber,
      title: data.title,
      supplierName: data.supplierName,
      totalValue: data.totalValue,
      signDate: data.signDate ? new Date(data.signDate) : new Date(),
      status: 'active',
      notes: data.notes,
    },
  });

  revalidatePath('/contracts');
  return { success: true, contract };
}

export async function updateContract(id: number, data: {
  contractNumber: string;
  title: string;
  supplierName: string;
  totalValue: number;
  status: string;
  notes?: string;
}) {
  const contract = await prisma.contract.update({
    where: { id },
    data: {
      contractNumber: data.contractNumber,
      title: data.title,
      supplierName: data.supplierName,
      totalValue: data.totalValue,
      status: data.status,
      notes: data.notes,
    },
  });

  revalidatePath('/contracts');
  return { success: true, contract };
}

export async function deleteContract(id: number) {
  await requireAuth(['admin', 'kho']);
  // Delete associated batches and import vouchers
  await prisma.$transaction(async (tx) => {
    const vouchers = await tx.importVoucher.findMany({ where: { contractId: id } });
    for (const v of vouchers) {
      // Revert details inventory
      const details = await tx.importVoucherDetail.findMany({ where: { importVoucherId: v.id } });
      for (const d of details) {
        if (d.sparePartId) {
          await tx.inventory.updateMany({
            where: { unitId: v.unitId, sparePartId: d.sparePartId, status: 'new' },
            data: { quantity: { decrement: d.quantity } },
          });
        } else if (d.meterId) {
          await tx.inventory.updateMany({
            where: { unitId: v.unitId, meterId: d.meterId, status: 'new' },
            data: { quantity: { decrement: d.quantity } },
          });
        }
      }
      await tx.importVoucherDetail.deleteMany({ where: { importVoucherId: v.id } });
      await tx.importVoucher.delete({ where: { id: v.id } });
    }

    await tx.contractBatch.deleteMany({ where: { contractId: id } });
    await tx.contract.delete({ where: { id } });
  });

  try {
    revalidatePath('/contracts');
    revalidatePath('/');
  } catch (e) {
    // Ignore
  }
  return { success: true };
}

export async function createContractBatch(data: {
  contractId: number;
  batchName: string;
  expectedDate?: string;
  notes?: string;
}) {
  const existingCount = await prisma.contractBatch.count({
    where: { contractId: data.contractId },
  });

  const batch = await prisma.contractBatch.create({
    data: {
      contractId: data.contractId,
      batchNumber: existingCount + 1,
      batchName: data.batchName,
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
      status: 'pending',
      notes: data.notes,
    },
  });

  revalidatePath('/contracts');
  return { success: true, batch };
}

export async function updateContractBatch(id: number, data: {
  batchName: string;
  status: string;
  notes?: string;
}) {
  const batch = await prisma.contractBatch.update({
    where: { id },
    data: {
      batchName: data.batchName,
      status: data.status,
      notes: data.notes,
    },
  });

  revalidatePath('/contracts');
  return { success: true, batch };
}

export async function deleteContractBatch(id: number) {
  await requireAuth(['admin', 'kho']);
  await prisma.contractBatch.delete({ where: { id } });
  revalidatePath('/contracts');
  return { success: true };
}


export async function importBatchGoods(data: {
  contractId: number;
  batchId: number;
  items: Array<{
    itemType: 'spare_part' | 'meter';
    itemId: number;
    quantity: number;
    unitPrice: number;
  }>;
  notes?: string;
  customerDeptName?: string;
  creatorName?: string;
  workshopManagerName?: string;
}) {
  const khoVp = await prisma.unit.findFirst({
    where: { OR: [{ code: 'KHO-VP' }, { type: 'Kho/Xưởng' }, { sortOrder: 0 }] },
  });
  if (!khoVp) throw new Error('Kho VP not found');
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });

  const year = new Date().getFullYear();
  const count = await prisma.importVoucher.count();
  const code = `PNK-${year}-${String(count + 1).padStart(4, '0')}`;

  const totalAmount = data.items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);

  await prisma.$transaction(async (tx) => {
    // 1. Create Import Voucher
    const voucher = await tx.importVoucher.create({
      data: {
        code,
        voucherDate: new Date(),
        importReason: 'purchase_contract',
        contractId: data.contractId,
        contractBatchId: data.batchId,
        unitId: khoVp.id,
        delivererName: data.customerDeptName || 'Đại diện bên giao hàng',
        receiverName: data.creatorName || 'Nguyễn Văn Tiến',
        technicianName: data.workshopManagerName || 'Bùi Đức Duy',
        customerDeptName: data.customerDeptName || 'Đại diện bên giao hàng',
        createdBy: admin?.id ?? 1,
        status: 'completed',
        totalAmount,
        notes: data.notes || 'Nhập kho linh kiện và đồng hồ mới theo hợp đồng',
      },
    });

    // 2. Details & Inventory Increment
    for (const item of data.items) {
      if (item.quantity <= 0) continue;

      if (item.itemType === 'spare_part') {
        await tx.importVoucherDetail.create({
          data: {
            importVoucherId: voucher.id,
            sparePartId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineAmount: item.quantity * item.unitPrice,
            status: 'new',
          },
        });

        // Update spare part inventory at Kho VP
        const existing = await tx.inventory.findFirst({
          where: { unitId: khoVp.id, sparePartId: item.itemId, status: 'new' },
        });

        if (existing) {
          await tx.inventory.update({
            where: { id: existing.id },
            data: { quantity: { increment: item.quantity } },
          });
        } else {
          await tx.inventory.create({
            data: {
              unitId: khoVp.id,
              sparePartId: item.itemId,
              quantity: item.quantity,
              status: 'new',
            },
          });
        }
      } else {
        // Meter
        await tx.importVoucherDetail.create({
          data: {
            importVoucherId: voucher.id,
            meterId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineAmount: item.quantity * item.unitPrice,
            status: 'new',
          },
        });

        // Update meter inventory at Kho VP (new status)
        const existing = await tx.inventory.findFirst({
          where: { unitId: khoVp.id, meterId: item.itemId, status: 'new' },
        });

        if (existing) {
          await tx.inventory.update({
            where: { id: existing.id },
            data: { quantity: { increment: item.quantity } },
          });
        } else {
          await tx.inventory.create({
            data: {
              unitId: khoVp.id,
              meterId: item.itemId,
              quantity: item.quantity,
              status: 'new',
            },
          });
        }
      }
    }

    // 3. Mark batch completed
    await tx.contractBatch.update({
      where: { id: data.batchId },
      data: {
        status: 'completed',
        actualDate: new Date(),
      },
    });
  });

  try {
    revalidatePath('/contracts');
    revalidatePath('/');
  } catch (e) {
    // Ignore
  }
  return { success: true, code };
}

export async function deleteImportVoucher(id: number) {
  await requireAuth(['admin', 'kho']);
  await prisma.$transaction(async (tx) => {
    const voucher = await tx.importVoucher.findUnique({
      where: { id },
      include: { details: true },
    });
    if (!voucher) throw new Error('Phiếu nhập không tồn tại');

    // Check if goods have already been consumed before reverting
    for (const d of voucher.details) {
      if (d.sparePartId) {
        const inv = await tx.inventory.findFirst({
          where: { unitId: voucher.unitId, sparePartId: d.sparePartId, status: 'new' },
        });
        const currentStock = inv?.quantity || 0;
        if (currentStock < d.quantity) {
          const part = await tx.sparePart.findUnique({ where: { id: d.sparePartId } });
          throw new Error(
            `Không thể xóa phiếu nhập: Linh kiện "${part?.name || d.sparePartId}" đã được xuất dùng (Tồn hiện tại: ${currentStock}, số lượng hoàn trả: ${d.quantity}).`
          );
        }
      } else if (d.meterId) {
        const inv = await tx.inventory.findFirst({
          where: { unitId: voucher.unitId, meterId: d.meterId, status: 'new' },
        });
        const currentStock = inv?.quantity || 0;
        if (currentStock < d.quantity) {
          const meter = await tx.meter.findUnique({ where: { id: d.meterId } });
          throw new Error(
            `Không thể xóa phiếu nhập: Đồng hồ "${meter?.name || d.meterId}" đã được xuất cấp (Tồn hiện tại: ${currentStock}, số lượng hoàn trả: ${d.quantity}).`
          );
        }
      }
    }

    // Revert inventory
    for (const d of voucher.details) {
      if (d.sparePartId) {
        await tx.inventory.updateMany({
          where: { unitId: voucher.unitId, sparePartId: d.sparePartId, status: 'new' },
          data: { quantity: { decrement: d.quantity } },
        });
      } else if (d.meterId) {
        await tx.inventory.updateMany({
          where: { unitId: voucher.unitId, meterId: d.meterId, status: 'new' },
          data: { quantity: { decrement: d.quantity } },
        });
      }
    }

    await tx.importVoucherDetail.deleteMany({ where: { importVoucherId: id } });
    await tx.importVoucher.delete({ where: { id } });
  });

  safeRevalidatePath('/contracts');
  safeRevalidatePath('/reports');
  safeRevalidatePath('/unit-reports');
  safeRevalidatePath('/');
  return { success: true };
}

export async function updateImportVoucher(
  id: number,
  data: {
    code?: string;
    voucherDate?: string;
    notes?: string;
    customerDeptName?: string;
    delivererName?: string;
    creatorName?: string;
    workshopManagerName?: string;
    items?: Array<{
      itemType: 'spare_part' | 'meter';
      itemId: number;
      quantity: number;
    }>;
  }
) {
  await requireAuth(['admin', 'kho']);
  const khoVp = await prisma.unit.findFirst({
    where: { OR: [{ code: 'KHO-VP' }, { type: 'Kho/Xưởng' }, { sortOrder: 0 }] },
  });
  if (!khoVp) throw new Error('Kho VP not found');

  const existing = await prisma.importVoucher.findUnique({
    where: { id },
    include: { details: true },
  });
  if (!existing) throw new Error('Phiếu nhập không tồn tại');

  if (data.code && data.code.trim() !== existing.code) {
    const duplicate = await prisma.importVoucher.findUnique({
      where: { code: data.code.trim() },
    });
    if (duplicate) {
      throw new Error(`Số phiếu "${data.code.trim()}" đã được sử dụng.`);
    }
  }

  await prisma.$transaction(async (tx) => {
    if (data.items && data.items.length > 0) {
      // 1. Calculate net inventory changes per item (delta = newQty - oldQty)
      // Build old map: key -> oldQty
      const oldSpareMap = new Map<number, number>();
      const oldMeterMap = new Map<number, number>();
      for (const d of existing.details) {
        if (d.sparePartId) {
          oldSpareMap.set(d.sparePartId, (oldSpareMap.get(d.sparePartId) || 0) + d.quantity);
        } else if (d.meterId) {
          oldMeterMap.set(d.meterId, (oldMeterMap.get(d.meterId) || 0) + d.quantity);
        }
      }

      // Build new map: key -> newQty
      const newSpareMap = new Map<number, number>();
      const newMeterMap = new Map<number, number>();
      for (const item of data.items) {
        if (item.quantity <= 0) continue;
        if (item.itemType === 'spare_part') {
          newSpareMap.set(item.itemId, (newSpareMap.get(item.itemId) || 0) + item.quantity);
        } else {
          newMeterMap.set(item.itemId, (newMeterMap.get(item.itemId) || 0) + item.quantity);
        }
      }

      // Check and apply net difference for spare parts
      const allSpareIds = new Set([...oldSpareMap.keys(), ...newSpareMap.keys()]);
      for (const spId of allSpareIds) {
        const oldQ = oldSpareMap.get(spId) || 0;
        const newQ = newSpareMap.get(spId) || 0;
        const delta = newQ - oldQ; // Positive = add stock, Negative = reduce stock
        if (delta !== 0) {
          const inv = await tx.inventory.findFirst({
            where: { unitId: existing.unitId, sparePartId: spId, status: 'new' },
          });
          const currentStock = inv?.quantity || 0;
          if (delta < 0 && currentStock < Math.abs(delta)) {
            const part = await tx.sparePart.findUnique({ where: { id: spId } });
            throw new Error(
              `Không thể giảm số lượng linh kiện "${part?.name || spId}" bớt ${Math.abs(delta)} vì tồn kho hiện tại chỉ còn ${currentStock}.`
            );
          }
          await tx.inventory.upsert({
            where: {
              unitId_sparePartId_status: {
                unitId: existing.unitId,
                sparePartId: spId,
                status: 'new',
              },
            },
            create: {
              unitId: existing.unitId,
              sparePartId: spId,
              quantity: Math.max(0, delta),
              status: 'new',
            },
            update: {
              quantity: { increment: delta },
            },
          });
        }
      }

      // Check and apply net difference for meters
      const allMeterIds = new Set([...oldMeterMap.keys(), ...newMeterMap.keys()]);
      for (const mId of allMeterIds) {
        const oldQ = oldMeterMap.get(mId) || 0;
        const newQ = newMeterMap.get(mId) || 0;
        const delta = newQ - oldQ;
        if (delta !== 0) {
          const inv = await tx.inventory.findFirst({
            where: { unitId: existing.unitId, meterId: mId, status: 'new' },
          });
          const currentStock = inv?.quantity || 0;
          if (delta < 0 && currentStock < Math.abs(delta)) {
            const meter = await tx.meter.findUnique({ where: { id: mId } });
            throw new Error(
              `Không thể giảm số lượng đồng hồ "${meter?.name || mId}" bớt ${Math.abs(delta)} vì tồn kho hiện tại chỉ còn ${currentStock}.`
            );
          }
          await tx.inventory.upsert({
            where: {
              unitId_meterId_status: {
                unitId: existing.unitId,
                meterId: mId,
                status: 'new',
              },
            },
            create: {
              unitId: existing.unitId,
              meterId: mId,
              quantity: Math.max(0, delta),
              status: 'new',
            },
            update: {
              quantity: { increment: delta },
            },
          });
        }
      }

      // 2. Re-create voucher details
      await tx.importVoucherDetail.deleteMany({ where: { importVoucherId: id } });

      for (const item of data.items) {
        if (item.quantity <= 0) continue;
        if (item.itemType === 'spare_part') {
          await tx.importVoucherDetail.create({
            data: {
              importVoucherId: id,
              sparePartId: item.itemId,
              quantity: item.quantity,
              status: 'new',
            },
          });
        } else {
          await tx.importVoucherDetail.create({
            data: {
              importVoucherId: id,
              meterId: item.itemId,
              quantity: item.quantity,
              status: 'new',
            },
          });
        }
      }
    }

    const targetDeliverer = data.delivererName !== undefined ? data.delivererName : (data.customerDeptName !== undefined ? data.customerDeptName : existing.delivererName);

    await tx.importVoucher.update({
      where: { id },
      data: {
        code: data.code?.trim() || existing.code,
        voucherDate: data.voucherDate ? new Date(data.voucherDate) : existing.voucherDate,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        delivererName: targetDeliverer,
        receiverName: data.creatorName !== undefined ? data.creatorName : existing.receiverName,
        technicianName: data.workshopManagerName !== undefined ? data.workshopManagerName : existing.technicianName,
        customerDeptName: targetDeliverer,
      },
    });
  });

  const updatedVoucher = await prisma.importVoucher.findUnique({
    where: { id },
    include: {
      contract: true,
      batch: true,
      details: {
        include: {
          meter: true,
          sparePart: true,
        },
      },
    },
  });

  safeRevalidatePath('/contracts');
  safeRevalidatePath('/reports');
  safeRevalidatePath('/unit-reports');
  safeRevalidatePath('/');
  return { success: true, voucher: updatedVoucher };
}
