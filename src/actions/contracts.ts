'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, getSessionUser } from '@/lib/auth';

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
      take: 50,
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
  await requireAuth(['admin']);
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

  revalidatePath('/contracts');
  revalidatePath('/inventory');
  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  revalidatePath('/');
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
  await requireAuth(['admin']);
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
        delivererName: data.customerDeptName || 'Phạm Phương Đông',
        receiverName: data.creatorName || 'Nguyễn Văn Tiến',
        technicianName: data.workshopManagerName || 'Bùi Đức Duy',
        customerDeptName: data.customerDeptName || 'Phạm Phương Đông',
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

  revalidatePath('/contracts');
  revalidatePath('/inventory');
  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  revalidatePath('/');
  return { success: true, code };
}

export async function deleteImportVoucher(id: number) {
  await requireAuth(['admin']);
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

  revalidatePath('/contracts');
  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  revalidatePath('/');
  return { success: true };
}

export async function updateImportVoucher(
  id: number,
  data: {
    voucherDate?: string;
    notes?: string;
    customerDeptName?: string;
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

  await prisma.$transaction(async (tx) => {
    if (data.items && data.items.length > 0) {
      // 1. Revert previous inventory increments (check current stock first)
      for (const d of existing.details) {
        if (d.sparePartId) {
          const inv = await tx.inventory.findFirst({
            where: { unitId: existing.unitId, sparePartId: d.sparePartId, status: 'new' },
          });
          const currentStock = inv?.quantity || 0;
          if (currentStock < d.quantity) {
            const part = await tx.sparePart.findUnique({ where: { id: d.sparePartId } });
            throw new Error(
              `Không thể sửa đổi phiếu nhập: Linh kiện "${part?.name || d.sparePartId}" đã được xuất dùng (Tồn hiện tại: ${currentStock}, số lượng hoàn trả: ${d.quantity}).`
            );
          }
          await tx.inventory.updateMany({
            where: { unitId: existing.unitId, sparePartId: d.sparePartId, status: 'new' },
            data: { quantity: { decrement: d.quantity } },
          });
        } else if (d.meterId) {
          const inv = await tx.inventory.findFirst({
            where: { unitId: existing.unitId, meterId: d.meterId, status: 'new' },
          });
          const currentStock = inv?.quantity || 0;
          if (currentStock < d.quantity) {
            const meter = await tx.meter.findUnique({ where: { id: d.meterId } });
            throw new Error(
              `Không thể sửa đổi phiếu nhập: Đồng hồ "${meter?.name || d.meterId}" đã được xuất cấp (Tồn hiện tại: ${currentStock}, số lượng hoàn trả: ${d.quantity}).`
            );
          }
          await tx.inventory.updateMany({
            where: { unitId: existing.unitId, meterId: d.meterId, status: 'new' },
            data: { quantity: { decrement: d.quantity } },
          });
        }
      }

      // 2. Re-create details
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
          await tx.inventory.upsert({
            where: {
              unitId_sparePartId_status: {
                unitId: khoVp.id,
                sparePartId: item.itemId,
                status: 'new',
              },
            },
            create: {
              unitId: khoVp.id,
              sparePartId: item.itemId,
              quantity: item.quantity,
              status: 'new',
            },
            update: { quantity: { increment: item.quantity } },
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
          await tx.inventory.upsert({
            where: {
              unitId_meterId_status: {
                unitId: khoVp.id,
                meterId: item.itemId,
                status: 'new',
              },
            },
            create: {
              unitId: khoVp.id,
              meterId: item.itemId,
              quantity: item.quantity,
              status: 'new',
            },
            update: { quantity: { increment: item.quantity } },
          });
        }
      }
    }

    await tx.importVoucher.update({
      where: { id },
      data: {
        voucherDate: data.voucherDate ? new Date(data.voucherDate) : existing.voucherDate,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        delivererName: data.customerDeptName !== undefined ? data.customerDeptName : existing.delivererName,
        receiverName: data.creatorName !== undefined ? data.creatorName : existing.receiverName,
        technicianName: data.workshopManagerName !== undefined ? data.workshopManagerName : existing.technicianName,
        customerDeptName: data.customerDeptName !== undefined ? data.customerDeptName : existing.customerDeptName,
      },
    });
  });

  revalidatePath('/contracts');
  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  revalidatePath('/');
  return { success: true };
}
