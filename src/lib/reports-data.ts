import { prisma } from '@/lib/prisma';
import { buildMultiYearReportsData } from '@/services/reports.service';
import { getSessionUser } from '@/lib/auth';

import excelOracle from '@/data/excel-oracle.json';
import monthlyExportsFull from '@/data/monthly-exports-full.json';
import unitMonthlyExportsData from '@/data/unit-monthly-exports.json';
import unitMonthlyReturnsData from '@/data/unit-monthly-returns.json';
import unitYearlyPlansData from '@/data/unit-yearly-plans.json';
import unitUsedYearlyPlansData from '@/data/unit-used-yearly-plans.json';

export async function getAggregatedReportsData() {
  const oracle = excelOracle as any;
  const monthlyExports = monthlyExportsFull as any;
  const unitMonthlyExports = unitMonthlyExportsData as any;
  const unitMonthlyReturns = unitMonthlyReturnsData as any;
  const unitYearlyPlans = (unitYearlyPlansData || {}) as Record<string, number>;
  const unitUsedYearlyPlans = (unitUsedYearlyPlansData || {}) as Record<string, number>;
  const openingOverrides = { meters: { '2026': { 'ĐH015(SC)': 13 } }, parts: {} };

  // Fetch live meters, spare parts, units, vouchers from DB & current user session
  // Note: optimize queries by omitting unused deep nested relations on Cloudflare Workers
  const [allMeters, allSpareParts, units, allExportVouchers, allImportVouchers, allRepairVouchers, employees, user] = await Promise.all([
    prisma.meter.findMany({ orderBy: { code: 'asc' } }),
    prisma.sparePart.findMany({ orderBy: { code: 'asc' } }),
    prisma.unit.findMany({
      where: { code: { not: 'KHO-VP' } },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.exportVoucher.findMany({
      where: { destinationUnitId: { not: null } },
      include: {
        destinationUnit: true,
        details: { include: { meter: true } },
      },
      orderBy: { voucherDate: 'asc' },
    }),
    prisma.importVoucher.findMany({
      include: {
        contract: true,
        batch: true,
        details: { include: { meter: true, sparePart: true } },
      },
      orderBy: { voucherDate: 'asc' },
    }),
    prisma.repairVoucher.findMany({
      include: {
        meter: true,
        user: true,
        technician: true,
        sparePartUsages: { include: { sparePart: true } },
      },
      orderBy: { repairDate: 'asc' },
    }),
    prisma.employee.findMany({ orderBy: { fullName: 'asc' } }),
    getSessionUser(),
  ]);

  // Aggregate multi-year data (supports 2025, 2026, and any voucher years)
  const { availableYears, yearlyData } = buildMultiYearReportsData({
    base2026Monthly: monthlyExports,
    base2026UnitMonthly: unitMonthlyExports,
    base2026UnitMonthlyReturns: unitMonthlyReturns,
    baseOracleMeters: oracle.meters,
    baseOracleParts: oracle.spare_parts,
    allMeters: allMeters,
    allSpareParts: allSpareParts,
    allExportVouchers: allExportVouchers,
    allImportVouchers: allImportVouchers,
    allRepairVouchers: allRepairVouchers,
    openingOverrides,
  });

  const unitSummaries = units.map((u) => {
    let newM = 0;
    let circM = 0;
    for (const exp of allExportVouchers) {
      if (exp.destinationUnitId === u.id) {
        for (const d of (exp.details || [])) {
          if (d.status === 'new') newM += (d.quantity || 0);
          else if (d.status === 'circulating') circM += (d.quantity || 0);
        }
      }
    }

    const cleanName = u.name
      .replace('Chi nhánh Cấp nước', 'CN Cấp nước')
      .replace('Xí nghiệp Cấp nước', 'XN Cấp nước');

    return {
      id: u.id,
      code: u.code,
      name: cleanName,
      newM,
      circM,
      totalExported: newM + circM,
    };
  });

  // Optimize payload: only serialize what client components actually use
  const optimizedExportVouchers = allExportVouchers.map((v) => ({
    id: v.id,
    code: v.code,
    voucherDate: v.voucherDate,
    destinationUnit: v.destinationUnit ? { id: v.destinationUnit.id, code: v.destinationUnit.code, name: v.destinationUnit.name } : null,
    notes: v.notes || '',
  }));

  const optimizedUnits = units.map((u) => ({
    id: u.id,
    code: u.code,
    name: u.name,
    sortOrder: u.sortOrder,
  }));

  return {
    oracle,
    availableYears,
    yearlyData,
    unitSummaries,
    user,
    allExportVouchers: optimizedExportVouchers,
    units: optimizedUnits,
    employees,
    unitYearlyPlans,
    unitUsedYearlyPlans,
  };
}
