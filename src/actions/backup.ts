'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {}
}

export async function exportSystemBackup() {
  await requireAuth(['admin']);

  // Check AppSetting if exists
  let appSettings: any[] = [];
  try {
    appSettings = await (prisma as any).$queryRawUnsafe(`SELECT key, value FROM AppSetting;`);
  } catch {}

  const [
    units,
    users,
    employees,
    meters,
    spareParts,
    meterSpareParts,
    inventories,
    contracts,
    contractBatches,
    importVouchers,
    importVoucherDetails,
    exportVouchers,
    exportVoucherDetails,
    transferVouchers,
    transferVoucherDetails,
    repairVouchers,
    repairVoucherSpareParts,
    meterInspections,
    alerts,
  ] = await Promise.all([
    prisma.unit.findMany({ orderBy: { id: 'asc' } }),
    prisma.user.findMany({ orderBy: { id: 'asc' } }),
    prisma.employee.findMany({ orderBy: { id: 'asc' } }),
    prisma.meter.findMany({ orderBy: { id: 'asc' } }),
    prisma.sparePart.findMany({ orderBy: { id: 'asc' } }),
    prisma.meterSparePart.findMany(),
    prisma.inventory.findMany({ orderBy: { id: 'asc' } }),
    prisma.contract.findMany({ orderBy: { id: 'asc' } }),
    prisma.contractBatch.findMany({ orderBy: { id: 'asc' } }),
    prisma.importVoucher.findMany({ orderBy: { id: 'asc' } }),
    prisma.importVoucherDetail.findMany({ orderBy: { id: 'asc' } }),
    prisma.exportVoucher.findMany({ orderBy: { id: 'asc' } }),
    prisma.exportVoucherDetail.findMany({ orderBy: { id: 'asc' } }),
    prisma.transferVoucher.findMany({ orderBy: { id: 'asc' } }),
    prisma.transferVoucherDetail.findMany({ orderBy: { id: 'asc' } }),
    prisma.repairVoucher.findMany({ orderBy: { id: 'asc' } }),
    prisma.repairVoucherSparePart.findMany({ orderBy: { id: 'asc' } }),
    prisma.meterInspection.findMany({ orderBy: { id: 'asc' } }),
    prisma.alert.findMany({ orderBy: { id: 'asc' } }),
  ]);

  return {
    version: '1.0',
    appName: 'SOWASUCO Water Meter Management',
    exportDate: new Date().toISOString(),
    summary: {
      units: units.length,
      users: users.length,
      employees: employees.length,
      meters: meters.length,
      spareParts: spareParts.length,
      inventories: inventories.length,
      contracts: contracts.length,
      contractBatches: contractBatches.length,
      importVouchers: importVouchers.length,
      importVoucherDetails: importVoucherDetails.length,
      exportVouchers: exportVouchers.length,
      exportVoucherDetails: exportVoucherDetails.length,
      transferVouchers: transferVouchers.length,
      repairVouchers: repairVouchers.length,
      repairVoucherSpareParts: repairVoucherSpareParts.length,
      meterInspections: meterInspections.length,
    },
    data: {
      units,
      users,
      employees,
      meters,
      spareParts,
      meterSpareParts,
      inventories,
      contracts,
      contractBatches,
      importVouchers,
      importVoucherDetails,
      exportVouchers,
      exportVoucherDetails,
      transferVouchers,
      transferVoucherDetails,
      repairVouchers,
      repairVoucherSpareParts,
      meterInspections,
      alerts,
      appSettings,
    },
  };
}

export async function restoreSystemBackup(backupPayload: any) {
  await requireAuth(['admin']);

  if (!backupPayload || !backupPayload.data) {
    throw new Error('Định dạng tệp sao lưu không hợp lệ. Thiếu dữ liệu cấu trúc data.');
  }

  const d = backupPayload.data;
  const toDate = (val: any) => (val ? new Date(val) : new Date());

  await prisma.$transaction(
    async (tx) => {
      // 1. Clear child tables first in reverse topological order
      await tx.auditLog.deleteMany();
      await tx.repairVoucherSparePart.deleteMany();
      await tx.repairVoucher.deleteMany();
      await tx.meterInspection.deleteMany();
      await tx.transferVoucherDetail.deleteMany();
      await tx.transferVoucher.deleteMany();
      await tx.exportVoucherDetail.deleteMany();
      await tx.exportVoucher.deleteMany();
      await tx.importVoucherDetail.deleteMany();
      await tx.importVoucher.deleteMany();
      await tx.contractBatch.deleteMany();
      await tx.contract.deleteMany();
      await tx.inventory.deleteMany();
      await tx.meterSparePart.deleteMany();
      await tx.alert.deleteMany();
      await tx.employee.deleteMany();
      await tx.user.deleteMany();
      await tx.sparePart.deleteMany();
      await tx.meter.deleteMany();
      await tx.unit.deleteMany();

      // 2. Re-insert parent tables first
      // A. Units
      if (Array.isArray(d.units) && d.units.length > 0) {
        for (const u of d.units) {
          await tx.unit.create({
            data: {
              id: u.id,
              code: u.code,
              name: u.name,
              type: u.type,
              address: u.address,
              phone: u.phone,
              email: u.email,
              sortOrder: u.sortOrder ?? 0,
              isActive: u.isActive ?? true,
              createdAt: toDate(u.createdAt),
              updatedAt: toDate(u.updatedAt),
            },
          });
        }
      }

      // B. Meters
      if (Array.isArray(d.meters) && d.meters.length > 0) {
        for (const m of d.meters) {
          await tx.meter.create({
            data: {
              id: m.id,
              code: m.code,
              name: m.name,
              category: m.category,
              size: m.size,
              unit: m.unit || 'Cái',
              manufacturer: m.manufacturer || m.brand || null,
              yearManufacture: m.yearManufacture,
              unitPrice: m.unitPrice ?? 0,
              depreciationPrice: m.depreciationPrice ?? 0,
              isActive: m.isActive ?? true,
              notes: m.notes,
              createdAt: toDate(m.createdAt),
              updatedAt: toDate(m.updatedAt),
            },
          });
        }
      }

      // C. SpareParts
      if (Array.isArray(d.spareParts) && d.spareParts.length > 0) {
        for (const sp of d.spareParts) {
          await tx.sparePart.create({
            data: {
              id: sp.id,
              code: sp.code,
              name: sp.name,
              category: sp.category,
              size: sp.size,
              unit: sp.unit || 'Cái',
              unitPrice: sp.unitPrice ?? 0,
              minStock: sp.minStock ?? 10,
              isActive: sp.isActive ?? true,
              notes: sp.notes,
              createdAt: toDate(sp.createdAt),
              updatedAt: toDate(sp.updatedAt),
            },
          });
        }
      }

      // D. Users
      if (Array.isArray(d.users) && d.users.length > 0) {
        for (const usr of d.users) {
          await tx.user.create({
            data: {
              id: usr.id,
              email: usr.email,
              passwordHash: usr.passwordHash,
              fullName: usr.fullName,
              phone: usr.phone,
              department: usr.department,
              role: usr.role,
              unitId: usr.unitId,
              isActive: usr.isActive ?? true,
              lastLogin: usr.lastLogin ? toDate(usr.lastLogin) : null,
              createdAt: toDate(usr.createdAt),
              updatedAt: toDate(usr.updatedAt),
            },
          });
        }
      }

      // E. Employees
      if (Array.isArray(d.employees) && d.employees.length > 0) {
        for (const emp of d.employees) {
          await tx.employee.create({
            data: {
              id: emp.id,
              fullName: emp.fullName,
              code: emp.code,
              position: emp.position,
              phone: emp.phone,
              department: emp.department,
              unitId: emp.unitId,
              isActive: emp.isActive ?? true,
              notes: emp.notes,
              createdAt: toDate(emp.createdAt),
              updatedAt: toDate(emp.updatedAt),
            },
          });
        }
      }

      // F. MeterSparePart links
      if (Array.isArray(d.meterSpareParts) && d.meterSpareParts.length > 0) {
        for (const link of d.meterSpareParts) {
          await tx.meterSparePart.create({
            data: {
              meterId: link.meterId,
              sparePartId: link.sparePartId,
              quantityPerSet: link.quantityPerSet ?? 1,
            },
          });
        }
      }

      // G. Inventory
      if (Array.isArray(d.inventories) && d.inventories.length > 0) {
        for (const inv of d.inventories) {
          await tx.inventory.create({
            data: {
              id: inv.id,
              unitId: inv.unitId,
              meterId: inv.meterId,
              sparePartId: inv.sparePartId,
              status: inv.status,
              quantity: inv.quantity,
              lastUpdated: inv.lastUpdated ? toDate(inv.lastUpdated) : new Date(),
            },
          });
        }
      }

      // H. Contracts
      if (Array.isArray(d.contracts) && d.contracts.length > 0) {
        for (const c of d.contracts) {
          await tx.contract.create({
            data: {
              id: c.id,
              contractNumber: c.contractNumber,
              title: c.title,
              supplierName: c.supplierName,
              signDate: c.signDate ? toDate(c.signDate) : null,
              totalValue: c.totalValue ?? 0,
              status: c.status,
              notes: c.notes,
              createdAt: toDate(c.createdAt),
              updatedAt: toDate(c.updatedAt),
            },
          });
        }
      }

      // I. ContractBatches
      if (Array.isArray(d.contractBatches) && d.contractBatches.length > 0) {
        for (const b of d.contractBatches) {
          await tx.contractBatch.create({
            data: {
              id: b.id,
              contractId: b.contractId,
              batchNumber: b.batchNumber,
              batchName: b.batchName,
              expectedDate: b.expectedDate ? toDate(b.expectedDate) : null,
              actualDate: b.actualDate ? toDate(b.actualDate) : (b.deliveryDate ? toDate(b.deliveryDate) : null),
              status: b.status,
              notes: b.notes,
              createdAt: toDate(b.createdAt),
              updatedAt: toDate(b.updatedAt),
            },
          });
        }
      }

      // J. ImportVouchers
      if (Array.isArray(d.importVouchers) && d.importVouchers.length > 0) {
        for (const iv of d.importVouchers) {
          await tx.importVoucher.create({
            data: {
              id: iv.id,
              code: iv.code,
              voucherDate: toDate(iv.voucherDate),
              importReason: iv.importReason,
              unitId: iv.unitId,
              sourceUnitId: iv.sourceUnitId,
              contractId: iv.contractId,
              contractBatchId: iv.contractBatchId,
              delivererName: iv.delivererName,
              receiverName: iv.receiverName,
              technicianName: iv.technicianName,
              customerDeptName: iv.customerDeptName,
              createdBy: iv.createdBy,
              status: iv.status,
              totalAmount: iv.totalAmount ?? 0,
              notes: iv.notes,
              createdAt: toDate(iv.createdAt),
              updatedAt: toDate(iv.updatedAt),
            },
          });
        }
      }

      // K. ImportVoucherDetails
      if (Array.isArray(d.importVoucherDetails) && d.importVoucherDetails.length > 0) {
        for (const ivd of d.importVoucherDetails) {
          await tx.importVoucherDetail.create({
            data: {
              id: ivd.id,
              importVoucherId: ivd.importVoucherId,
              meterId: ivd.meterId,
              sparePartId: ivd.sparePartId,
              quantity: ivd.quantity,
              unitPrice: ivd.unitPrice ?? 0,
              lineAmount: ivd.lineAmount ?? 0,
              status: ivd.status,
              notes: ivd.notes,
              createdAt: toDate(ivd.createdAt),
            },
          });
        }
      }

      // L. ExportVouchers
      if (Array.isArray(d.exportVouchers) && d.exportVouchers.length > 0) {
        for (const ev of d.exportVouchers) {
          await tx.exportVoucher.create({
            data: {
              id: ev.id,
              code: ev.code,
              voucherDate: toDate(ev.voucherDate),
              exportReason: ev.exportReason,
              unitId: ev.unitId,
              destinationUnitId: ev.destinationUnitId,
              delivererName: ev.delivererName,
              receiverName: ev.receiverName,
              createdBy: ev.createdBy,
              status: ev.status,
              totalAmount: ev.totalAmount ?? 0,
              notes: ev.notes,
              createdAt: toDate(ev.createdAt),
              updatedAt: toDate(ev.updatedAt),
            },
          });
        }
      }

      // M. ExportVoucherDetails
      if (Array.isArray(d.exportVoucherDetails) && d.exportVoucherDetails.length > 0) {
        for (const evd of d.exportVoucherDetails) {
          await tx.exportVoucherDetail.create({
            data: {
              id: evd.id,
              exportVoucherId: evd.exportVoucherId,
              meterId: evd.meterId,
              sparePartId: evd.sparePartId,
              quantity: evd.quantity,
              unitPrice: evd.unitPrice ?? 0,
              lineAmount: evd.lineAmount ?? 0,
              status: evd.status,
              notes: evd.notes,
              createdAt: toDate(evd.createdAt),
            },
          });
        }
      }

      // N. TransferVouchers
      if (Array.isArray(d.transferVouchers) && d.transferVouchers.length > 0) {
        for (const tv of d.transferVouchers) {
          await tx.transferVoucher.create({
            data: {
              id: tv.id,
              code: tv.code,
              voucherDate: toDate(tv.voucherDate),
              fromUnitId: tv.fromUnitId,
              toUnitId: tv.toUnitId,
              transferType: tv.transferType || 'dispatch_to_unit',
              totalQuantity: tv.totalQuantity ?? 0,
              createdBy: tv.createdBy,
              status: tv.status,
              notes: tv.notes,
              createdAt: toDate(tv.createdAt),
              updatedAt: toDate(tv.updatedAt),
            },
          });
        }
      }

      // O. TransferVoucherDetails
      if (Array.isArray(d.transferVoucherDetails) && d.transferVoucherDetails.length > 0) {
        for (const tvd of d.transferVoucherDetails) {
          await tx.transferVoucherDetail.create({
            data: {
              id: tvd.id,
              transferVoucherId: tvd.transferVoucherId,
              meterId: tvd.meterId,
              sparePartId: tvd.sparePartId,
              quantity: tvd.quantity,
              meterStatus: tvd.meterStatus || tvd.status || 'new',
              notes: tvd.notes,
              createdAt: toDate(tvd.createdAt),
            },
          });
        }
      }

      // P. RepairVouchers
      if (Array.isArray(d.repairVouchers) && d.repairVouchers.length > 0) {
        for (const rv of d.repairVouchers) {
          await tx.repairVoucher.create({
            data: {
              id: rv.id,
              code: rv.code,
              repairDate: toDate(rv.repairDate),
              workshopUnitId: rv.workshopUnitId,
              meterId: rv.meterId,
              inputQuantity: rv.inputQuantity,
              completedQuantity: rv.completedQuantity,
              scrappedQuantity: rv.scrappedQuantity,
              delivererName: rv.delivererName,
              receiverName: rv.receiverName,
              status: rv.status,
              createdBy: rv.createdBy,
              technicianId: rv.technicianId,
              notes: rv.notes,
              createdAt: toDate(rv.createdAt),
              updatedAt: toDate(rv.updatedAt),
            },
          });
        }
      }

      // Q. RepairVoucherSpareParts
      if (Array.isArray(d.repairVoucherSpareParts) && d.repairVoucherSpareParts.length > 0) {
        for (const rvp of d.repairVoucherSpareParts) {
          await tx.repairVoucherSparePart.create({
            data: {
              id: rvp.id,
              repairVoucherId: rvp.repairVoucherId,
              sparePartId: rvp.sparePartId,
              quantity: rvp.quantity,
              unitPrice: rvp.unitPrice ?? 0,
              createdAt: toDate(rvp.createdAt),
            },
          });
        }
      }

      // R. MeterInspections
      if (Array.isArray(d.meterInspections) && d.meterInspections.length > 0) {
        for (const mi of d.meterInspections) {
          await tx.meterInspection.create({
            data: {
              id: mi.id,
              code: mi.code || `PKD-${mi.id}`,
              inspectionDate: toDate(mi.inspectionDate),
              transferVoucherId: mi.transferVoucherId,
              unitId: mi.unitId,
              meterId: mi.meterId,
              quantityTotal: mi.quantityTotal ?? 0,
              passedQuantity: mi.passedQuantity ?? 0,
              failedQuantity: mi.failedQuantity ?? 0,
              repairQuantity: mi.repairQuantity ?? 0,
              inspectionType: mi.inspectionType || 'incoming',
              inspectorId: mi.inspectorId,
              notes: mi.notes,
              createdAt: toDate(mi.createdAt),
              updatedAt: toDate(mi.updatedAt),
            },
          });
        }
      }

      // S. Alerts
      if (Array.isArray(d.alerts) && d.alerts.length > 0) {
        for (const al of d.alerts) {
          await tx.alert.create({
            data: {
              id: al.id,
              unitId: al.unitId,
              meterId: al.meterId,
              sparePartId: al.sparePartId,
              alertType: al.alertType || al.type || 'low_stock',
              message: al.message || al.title || '',
              isRead: al.isRead ?? false,
              readAt: al.readAt ? toDate(al.readAt) : null,
              createdAt: toDate(al.createdAt),
            },
          });
        }
      }

      // T. AppSettings (opening balances, etc.)
      if (Array.isArray(d.appSettings) && d.appSettings.length > 0) {
        try {
          await (tx as any).$executeRawUnsafe(
            `CREATE TABLE IF NOT EXISTS AppSetting (key TEXT PRIMARY KEY, value TEXT NOT NULL, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP);`
          );
          for (const s of d.appSettings) {
            await (tx as any).$executeRawUnsafe(
              `INSERT INTO AppSetting (key, value, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = CURRENT_TIMESTAMP;`,
              s.key,
              s.value
            );
          }
        } catch {}
      }
    },
    {
      timeout: 60000,
    }
  );

  safeRevalidatePath('/');
  safeRevalidatePath('/distribution');
  safeRevalidatePath('/contracts');
  safeRevalidatePath('/used-meters');
  safeRevalidatePath('/repairs');
  safeRevalidatePath('/reports');
  safeRevalidatePath('/unit-reports');
  safeRevalidatePath('/inventory');
  safeRevalidatePath('/admin/users');

  return {
    success: true,
    message: `Đã khôi phục dữ liệu thành công (${d.units?.length || 0} đơn vị, ${d.meters?.length || 0} đồng hồ, ${d.importVouchers?.length || 0} phiếu nhập, ${d.exportVouchers?.length || 0} phiếu xuất, ${d.repairVouchers?.length || 0} phiếu sửa chữa)!`,
  };
}
