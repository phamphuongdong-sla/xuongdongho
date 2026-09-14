import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '@/lib/prisma';
import { buildMultiYearReportsData } from '@/services/reports.service';
import { getSessionUser } from '@/lib/auth';

export async function getAggregatedReportsData() {
  const oraclePath = path.join(process.cwd(), 'tests', 'fixtures', 'excel-oracle.json');
  let oracle = { meters: [], spare_parts: [] };
  if (fs.existsSync(oraclePath)) {
    oracle = JSON.parse(fs.readFileSync(oraclePath, 'utf8'));
  }

  const monthlyExportsPath = path.join(process.cwd(), 'tests', 'fixtures', 'monthly-exports-full.json');
  let monthlyExports = { months: [], products: [] };
  if (fs.existsSync(monthlyExportsPath)) {
    monthlyExports = JSON.parse(fs.readFileSync(monthlyExportsPath, 'utf8'));
  }

  const unitMonthlyExportsPath = path.join(process.cwd(), 'tests', 'fixtures', 'unit-monthly-exports.json');
  let unitMonthlyExports: any = { months: [], units: {} };
  if (fs.existsSync(unitMonthlyExportsPath)) {
    unitMonthlyExports = JSON.parse(fs.readFileSync(unitMonthlyExportsPath, 'utf8'));
  }

  const unitMonthlyReturnsPath = path.join(process.cwd(), 'tests', 'fixtures', 'unit-monthly-returns.json');
  let unitMonthlyReturns: any = { months: [], units: {} };
  if (fs.existsSync(unitMonthlyReturnsPath)) {
    unitMonthlyReturns = JSON.parse(fs.readFileSync(unitMonthlyReturnsPath, 'utf8'));
  }

  const openingBalancesPath = path.join(process.cwd(), 'data', 'opening-balances.json');
  let openingOverrides = { meters: {}, parts: {} };
  if (fs.existsSync(openingBalancesPath)) {
    try {
      openingOverrides = JSON.parse(fs.readFileSync(openingBalancesPath, 'utf8'));
    } catch (e) {
      console.error('Error reading opening balances in getAggregatedReportsData:', e);
    }
  }

  const unitPlansPath = path.join(process.cwd(), 'data', 'unit-yearly-plans.json');
  let unitYearlyPlans: Record<string, number> = {};
  if (fs.existsSync(unitPlansPath)) {
    try {
      unitYearlyPlans = JSON.parse(fs.readFileSync(unitPlansPath, 'utf8'));
    } catch (e) {
      console.error('Error reading unit yearly plans in getAggregatedReportsData:', e);
    }
  }

  const unitUsedPlansPath = path.join(process.cwd(), 'data', 'unit-used-yearly-plans.json');
  let unitUsedYearlyPlans: Record<string, number> = {};
  if (fs.existsSync(unitUsedPlansPath)) {
    try {
      unitUsedYearlyPlans = JSON.parse(fs.readFileSync(unitUsedPlansPath, 'utf8'));
    } catch (e) {
      console.error('Error reading unit used yearly plans in getAggregatedReportsData:', e);
    }
  }

  // Fetch live meters, spare parts, units, vouchers from DB & current user session
  const [allMeters, allSpareParts, units, allExportVouchers, allImportVouchers, allRepairVouchers, employees, user] = await Promise.all([
    prisma.meter.findMany({ orderBy: { code: 'asc' } }),
    prisma.sparePart.findMany({ orderBy: { code: 'asc' } }),
    prisma.unit.findMany({
      where: { code: { not: 'KHO-VP' } },
      include: {
        inventories: {
          include: { meter: true },
        },
        receivedExports: {
          include: { details: { include: { meter: true } } },
        },
      },
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

  // Aggregate multi-year data (supports 2025, 2026, 2027, 2028...)
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
    for (const exp of u.receivedExports) {
      for (const d of exp.details) {
        if (d.status === 'new') newM += d.quantity;
        else if (d.status === 'circulating') circM += d.quantity;
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

  return {
    oracle,
    availableYears,
    yearlyData,
    unitSummaries,
    user,
    allExportVouchers,
    units,
    employees,
    unitYearlyPlans,
    unitUsedYearlyPlans,
  };
}
