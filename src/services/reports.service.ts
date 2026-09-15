// SOWASUCO Water Meter Management System
// Multi-Year Reports Aggregator Service

export interface MonthData {
  circ: number;
  new: number;
  total: number;
}

export interface MeterReportItem {
  code: string;
  name: string;
  unit: string;
  months: Record<string, MonthData>;
  year_total: MonthData;
}

export interface UnitReportData {
  unitName: string;
  meters: MeterReportItem[];
}

export interface MeterImportRecord {
  voucherCode: string;
  voucherDate: string;
  importReason?: string;
  contractNumber?: string;
  batchName?: string;
  quantity: number;
  unitPrice?: number;
  status?: string;
}

export interface MeterExportRecord {
  voucherCode: string;
  voucherDate: string;
  exportReason: string;
  destinationName?: string;
  quantity: number;
  status?: string;
  notes?: string;
}

export interface MeterBalanceItem {
  code: string;
  name: string;
  category?: string;
  unit: string;
  opening: number;
  import: number;
  export: number;
  ending: number;
  importRecords?: MeterImportRecord[];
  exportRecords?: MeterExportRecord[];
}

export interface PartImportRecord {
  voucherCode: string;
  voucherDate: string;
  contractNumber?: string;
  batchName?: string;
  quantity: number;
  unitPrice?: number;
}

export interface PartUsedRecord {
  voucherCode: string;
  voucherDate: string;
  meterName?: string;
  quantity: number;
  technicianName?: string;
  notes?: string;
}

export interface PartBalanceItem {
  stt: number;
  name: string;
  category?: string;
  price: number;
  unit: string;
  opening: number;
  import: number;
  used: number;
  ending: number;
  importRecords?: PartImportRecord[];
  usedRecords?: PartUsedRecord[];
}

export interface UsedMetersSummaryItem {
  code: string;
  name: string;
  unit: string;
  totalReceived: number;
  totalRepaired: number;
  totalScrapped: number;
  endingWaitingRepair: number;
}

export interface YearlyReportData {
  months: string[];
  units: Record<string, UnitReportData>;
  products: MeterReportItem[];
  metersBalance: MeterBalanceItem[];
  partsBalance: PartBalanceItem[];
  usedMetersUnits?: Record<string, UnitReportData>;
  usedMetersProducts?: MeterReportItem[];
  usedMetersSummary?: UsedMetersSummaryItem[];
}

export const MONTHS_LIST = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export const STANDARD_UNIT_KEYS = [
  { key: 'TP1', abbr: 'TP1', name: 'XNCN Số 1' },
  { key: 'TP2', abbr: 'TP2', name: 'XNCN Số 2' },
  { key: 'MS', abbr: 'MS', name: 'XNCN Mai Sơn' },
  { key: 'MC + Vân hồ', abbr: 'MC', name: 'CNCN Mộc Châu' },
  { key: 'YC', abbr: 'YC', name: 'CNCN Yên Châu' },
  { key: 'PY', abbr: 'PY', name: 'CNCN Phù Yên' },
  { key: 'BY', abbr: 'BY', name: 'CNCN Bắc Yên' },
  { key: 'SM', abbr: 'SM', name: 'CNCN Sông Mã' },
  { key: 'SC', abbr: 'SC', name: 'CNCN Sốp Cộp' },
  { key: 'TC', abbr: 'TC', name: 'CNCN Thuận Châu' },
  { key: 'ML', abbr: 'ML', name: 'CNCN Mường La' },
  { key: 'QN', abbr: 'QN', name: 'CNCN Quỳnh Nhai' },
];

export function mapUnitToStandardKey(code?: string, name?: string): string {
  const c = code || '';
  const n = name || '';
  if (c === 'XNCN-TP01' || c === 'XNCN-01' || n.includes('TP 1') || n.includes('TP1') || n.includes('số 1') || n.includes('Số 1') || n.includes('XNCN 1') || n.includes('XNCN Số 1')) return 'TP1';
  if (c === 'XNCN-TP02' || c === 'XNCN-02' || n.includes('TP 2') || n.includes('TP2') || n.includes('số 2') || n.includes('Số 2') || n.includes('XNCN 2') || n.includes('XNCN Số 2')) return 'TP2';
  if (c === 'XNCN-MS' || n.includes('Mai Sơn')) return 'MS';
  if (c === 'CNCN-MC' || n.includes('Mộc Châu')) return 'MC + Vân hồ';
  if (c === 'CNCN-YC' || n.includes('Yên Châu')) return 'YC';
  if (c === 'CNCN-PY' || n.includes('Phù Yên')) return 'PY';
  if (c === 'CNCN-BY' || n.includes('Bắc Yên')) return 'BY';
  if (c === 'CNCN-SM' || n.includes('Sông Mã')) return 'SM';
  if (c === 'CN-SC' || c === 'CNCN-SC' || n.includes('Sốp Cộp')) return 'SC';
  if (c === 'CNCN-TC' || n.includes('Thuận Châu')) return 'TC';
  if (c === 'CNCN-ML' || n.includes('Mường La')) return 'ML';
  if (c === 'CNCN-QN' || n.includes('Quỳnh Nhai')) return 'QN';
  return c;
}

export const DN_ORDER_MAP: Record<string, number> = {
  'DN15': 15,
  'DN20': 20,
  'DN25': 25,
  'DN32': 32,
  'DN40': 40,
  'DN50': 50,
  'DN65': 65,
  'DN80': 80,
  'DN100': 100,
  'DN150': 150,
  'DN200': 200,
};

export function extractMeterDN(code?: string, name?: string): string {
  const s = `${code || ''} ${name || ''}`.toUpperCase();
  if (s.includes('DN200') || s.includes('D200') || s.includes('0200') || s.includes('200')) return 'DN200';
  if (s.includes('DN150') || s.includes('D150') || s.includes('0150') || s.includes('150')) return 'DN150';
  if (s.includes('DN100') || s.includes('D100') || s.includes('0100') || s.includes('100')) return 'DN100';
  if (s.includes('DN80') || s.includes('D80') || s.includes('080') || s.includes('80')) return 'DN80';
  if (s.includes('DN65') || s.includes('D65') || s.includes('065') || s.includes('65')) return 'DN65';
  if (s.includes('DN50') || s.includes('D50') || s.includes('050') || s.includes('50')) return 'DN50';
  if (s.includes('DN40') || s.includes('D40') || s.includes('040') || s.includes('40')) return 'DN40';
  if (s.includes('DN32') || s.includes('D32') || s.includes('032') || s.includes('32')) return 'DN32';
  if (s.includes('DN25') || s.includes('D25') || s.includes('025') || s.includes('25')) return 'DN25';
  if (s.includes('DN20') || s.includes('D20') || s.includes('020') || s.includes('20')) return 'DN20';
  if (s.includes('DN15') || s.includes('D15') || s.includes('015') || s.includes('15')) return 'DN15';
  return 'Khác';
}

export function isRepairedMeter(meter?: { code?: string; name?: string; category?: string } | null, status?: string): boolean {
  if (status === 'circulating') return true;
  if (status === 'new') return false;
  const c = (meter?.code || '').toUpperCase();
  const n = (meter?.name || '').toLowerCase();
  const cat = meter?.category || '';
  if (cat === 'Sửa chữa') return true;
  if (c.includes('(SC)') || c.includes('SC')) return true;
  if (n.includes('sửa chữa')) return true;
  return false;
}

function createEmptyMeterItem(code: string, name: string, unit: string): MeterReportItem {
  const months: Record<string, MonthData> = {};
  for (const m of MONTHS_LIST) {
    months[m] = { circ: 0, new: 0, total: 0 };
  }
  return {
    code,
    name,
    unit: unit || 'Cái',
    months,
    year_total: { circ: 0, new: 0, total: 0 },
  };
}

export function buildMultiYearReportsData({
  base2026Monthly,
  base2026UnitMonthly,
  base2026UnitMonthlyReturns,
  baseOracleMeters,
  baseOracleParts,
  allMeters,
  allSpareParts = [],
  allExportVouchers,
  allImportVouchers = [],
  allRepairVouchers = [],
  openingOverrides,
}: {
  base2026Monthly: { months: string[]; products: any[] };
  base2026UnitMonthly: { months: string[]; units: Record<string, any> };
  base2026UnitMonthlyReturns?: { months: string[]; units: Record<string, any> };
  baseOracleMeters: any[];
  baseOracleParts: any[];
  allMeters: any[];
  allSpareParts?: any[];
  allExportVouchers: any[];
  allImportVouchers?: any[];
  allRepairVouchers?: any[];
  openingOverrides?: {
    meters?: Record<string, Record<string, number>>;
    parts?: Record<string, Record<string, number>>;
  };
}): {
  availableYears: number[];
  yearlyData: Record<number, YearlyReportData>;
} {
  // Collect active data years: 2025 (historical baseline), 2026 (base year), current year, plus any year from DB vouchers
  const currentSystemYear = new Date().getFullYear();
  const yearSet = new Set<number>([2025, 2026, currentSystemYear]);
  
  for (const v of (allExportVouchers || [])) {
    if (v.voucherDate) {
      const yr = new Date(v.voucherDate).getFullYear();
      if (!isNaN(yr)) yearSet.add(yr);
    }
  }
  for (const v of (allImportVouchers || [])) {
    if (v.voucherDate) {
      const yr = new Date(v.voucherDate).getFullYear();
      if (!isNaN(yr)) yearSet.add(yr);
    }
  }
  for (const v of (allRepairVouchers || [])) {
    if (v.repairDate) {
      const yr = new Date(v.repairDate).getFullYear();
      if (!isNaN(yr)) yearSet.add(yr);
    }
  }

  const availableYears = Array.from(yearSet).sort((a, b) => a - b);
  const yearlyData: Record<number, YearlyReportData> = {};

  // Build live database lookup maps
  const dbMetersMap = new Map<string, any>();
  for (const m of (allMeters || [])) {
    if (m.isActive !== false) {
      dbMetersMap.set(m.code, m);
    }
  }

  const dbPartsMap = new Map<string, any>();
  const dbPartsByCodeMap = new Map<string, any>();
  for (const p of (allSpareParts || [])) {
    if (p.isActive !== false) {
      dbPartsMap.set(p.name, p);
      dbPartsMap.set(p.name.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(), p);
      if (p.code) dbPartsByCodeMap.set(p.code, p);
    }
  }

  // Standard meter catalogue: synchronized from base products and live DB meters
  const standardMetersList: Array<{ code: string; name: string; category: string; unit: string }> = [];
  const processedCodes = new Set<string>();

  if (base2026Monthly.products && base2026Monthly.products.length > 0) {
    for (const p of base2026Monthly.products) {
      if (allMeters.some(m => m.code === p.code && m.isActive === false)) continue;
      const dbMeter = dbMetersMap.get(p.code);
      standardMetersList.push({
        code: p.code,
        name: dbMeter?.name || p.name,
        category: dbMeter?.category || (p.code.includes('SC') ? 'Sửa chữa' : 'Tiêu chuẩn'),
        unit: dbMeter?.unit || p.unit,
      });
      processedCodes.add(p.code);
    }
  }

  for (const m of (allMeters || [])) {
    if (m.isActive !== false && !processedCodes.has(m.code)) {
      standardMetersList.push({
        code: m.code,
        name: m.name,
        category: m.category || 'Tiêu chuẩn',
        unit: m.unit || 'Cái',
      });
      processedCodes.add(m.code);
    }
  }
  const standardMeters = standardMetersList;

  // Standard spare parts catalogue: synchronized from oracle and live DB spare parts
  const standardPartsList: Array<{ stt: number; name: string; category: string; price: number; unit: string }> = [];
  const processedParts = new Set<string>();

  if (baseOracleParts && baseOracleParts.length > 0) {
    for (const p of baseOracleParts) {
      if (allSpareParts && allSpareParts.some(x => x.name === p.name && x.isActive === false)) continue;
      const cleanPName = p.name.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      const expectedCode = p.stt <= 13 ? `VP-D15-${String(p.stt).padStart(3, '0')}` : `VP-${String(p.stt).padStart(3, '0')}`;
      const dbPart = dbPartsMap.get(p.name) || dbPartsMap.get(cleanPName) || dbPartsByCodeMap.get(expectedCode);
      standardPartsList.push({
        stt: p.stt,
        name: dbPart?.name || p.name,
        category: dbPart?.category || 'Linh kiện',
        price: dbPart?.unitPrice !== undefined ? dbPart.unitPrice : (p.price || 0),
        unit: dbPart?.unit || p.unit || 'Cái',
      });
      if (dbPart) processedParts.add(dbPart.name);
      processedParts.add(p.name);
    }
  }

  let nextPartStt = standardPartsList.length + 1;
  for (const p of (allSpareParts || [])) {
    if (p.isActive !== false && !processedParts.has(p.name)) {
      standardPartsList.push({
        stt: nextPartStt++,
        name: p.name,
        category: p.category || 'Linh kiện',
        price: p.unitPrice || 0,
        unit: p.unit || 'Cái',
      });
      processedParts.add(p.name);
    }
  }

  // Prioritize DN15 spare parts first in list
  const isDN15SparePart = (name?: string, stt?: number) => {
    const str = (name || '').toLowerCase();
    if (str.includes('d15') || str.includes('dn15') || str.includes('d 15') || str.includes('dn 15')) return true;
    if (stt !== undefined && stt >= 1 && stt <= 13) return true;
    return false;
  };

  standardPartsList.sort((a, b) => {
    const a15 = isDN15SparePart(a.name, a.stt);
    const b15 = isDN15SparePart(b.name, b.stt);
    if (a15 && !b15) return -1;
    if (!a15 && b15) return 1;
    return (a.stt || 0) - (b.stt || 0);
  });
  standardPartsList.forEach((p, idx) => {
    p.stt = idx + 1;
  });

  const standardParts = standardPartsList;

  // Track carry-forward ending balances across sequential years
  let previousMetersEnding: Record<string, number> = {};
  let previousPartsEnding: Record<string, number> = {};

  for (const year of availableYears) {
    if (year === 2026 && base2026UnitMonthly && Object.keys(base2026UnitMonthly.units || {}).length > 0) {
      // 2026 baseline from Excel
      const clonedUnits: Record<string, UnitReportData> = JSON.parse(JSON.stringify(base2026UnitMonthly.units));
      const clonedProducts: MeterReportItem[] = JSON.parse(JSON.stringify(base2026Monthly.products || []));

      // Merge newly added 2026 vouchers (excluding initial sample voucher PXK-2026-0001)
      const yr2026Vouchers = allExportVouchers.filter(v => {
        const d = new Date(v.voucherDate);
        return d.getFullYear() === 2026 && v.code !== 'PXK-2026-0001';
      });

      for (const v of yr2026Vouchers) {
        const d = new Date(v.voucherDate);
        const mIdx = d.getMonth();
        const mName = MONTHS_LIST[mIdx];
        const unitKey = mapUnitToStandardKey(v.destinationUnit?.code, v.destinationUnit?.name);

        if (!clonedUnits[unitKey]) {
          const foundStd = STANDARD_UNIT_KEYS.find(u => u.key === unitKey || u.name === v.destinationUnit?.name);
          const finalKey = foundStd ? foundStd.key : unitKey;
          if (!clonedUnits[finalKey]) {
            clonedUnits[finalKey] = {
              unitName: v.destinationUnit?.name || unitKey,
              meters: standardMeters.map(sm => createEmptyMeterItem(sm.code, sm.name, sm.unit)),
            };
          }
        }

        const targetUnit = clonedUnits[unitKey] || clonedUnits[mapUnitToStandardKey(v.destinationUnit?.code, v.destinationUnit?.name)];
        if (targetUnit) {
          for (const det of (v.details || [])) {
            const mCode = det.meter?.code;
            if (!mCode) continue;
            const isRepaired = isRepairedMeter(det.meter, det.status);
            const qty = det.quantity || 0;

            let uMeter = targetUnit.meters.find(m => m.code === mCode);
            if (!uMeter) {
              uMeter = createEmptyMeterItem(mCode, det.meter?.name || mCode, det.meter?.unit || 'Cái');
              targetUnit.meters.push(uMeter);
            }
            if (uMeter) {
              if (!uMeter.months[mName]) uMeter.months[mName] = { circ: 0, new: 0, total: 0 };
              if (isRepaired) {
                uMeter.months[mName].circ += qty;
                uMeter.year_total.circ += qty;
              } else {
                uMeter.months[mName].new += qty;
                uMeter.year_total.new += qty;
              }
              uMeter.months[mName].total += qty;
              uMeter.year_total.total += qty;
            }

            let pMeter = clonedProducts.find(p => p.code === mCode);
            if (!pMeter) {
              pMeter = createEmptyMeterItem(mCode, det.meter?.name || mCode, det.meter?.unit || 'Cái');
              clonedProducts.push(pMeter);
            }
            if (pMeter) {
              if (!pMeter.months[mName]) pMeter.months[mName] = { circ: 0, new: 0, total: 0 };
              if (isRepaired) {
                pMeter.months[mName].circ += qty;
                pMeter.year_total.circ += qty;
              } else {
                pMeter.months[mName].new += qty;
                pMeter.year_total.new += qty;
              }
              pMeter.months[mName].total += qty;
              pMeter.year_total.total += qty;
            }
          }
        }
      }

      // 2026 newly created imports and repairs
      const yr2026Imports = allImportVouchers.filter(v => {
        const d = new Date(v.voucherDate);
        return d.getFullYear() === 2026;
      });

      const yr2026Repairs = allRepairVouchers.filter(v => {
        const d = new Date(v.repairDate || v.createdAt);
        return d.getFullYear() === 2026 && v.code !== 'PSC-2026-0001';
      });

      const yr2026NewPartsImportTotals: Record<string, number> = {};
      const yr2026NewPartsImportRecords: Record<string, PartImportRecord[]> = {};

      const yr2026NewMetersImportTotals: Record<string, number> = {};
      const yr2026NewMetersImportRecords: Record<string, MeterImportRecord[]> = {};

      for (const v of yr2026Imports) {
        const vDateStr = v.voucherDate ? new Date(v.voucherDate).toLocaleDateString('vi-VN') : '';
        const contractNum = v.contract?.contractNumber || '';
        const batchName = v.batch?.batchName || (v.contractBatchId ? `Đợt ${v.contractBatchId}` : 'Nhập kho');

        for (const det of (v.details || [])) {
          if (det.sparePart?.name) {
            const pName = det.sparePart.name;
            const qty = det.quantity || 0;
            yr2026NewPartsImportTotals[pName] = (yr2026NewPartsImportTotals[pName] || 0) + qty;
            if (!yr2026NewPartsImportRecords[pName]) {
              yr2026NewPartsImportRecords[pName] = [];
            }
            yr2026NewPartsImportRecords[pName].push({
              voucherCode: v.code,
              voucherDate: vDateStr,
              contractNumber: contractNum,
              batchName: batchName,
              quantity: qty,
              unitPrice: det.unitPrice || 0,
            });
          }

          if (det.meter?.code) {
            // Skip old meters returned from units (they are broken meters sent for inspection/repair)
            if (v.importReason === 'old_meters_return' || det.status === 'sent_for_repair') {
              continue;
            }
            const rawCode = det.meter.code;
            const isRepaired = det.status === 'circulating' || det.meter.category === 'Sửa chữa';
            const mCode = isRepaired && standardMeters.some(m => m.code === `${rawCode}(SC)`)
              ? `${rawCode}(SC)`
              : rawCode;
            const qty = det.quantity || 0;
            yr2026NewMetersImportTotals[mCode] = (yr2026NewMetersImportTotals[mCode] || 0) + qty;
            if (!yr2026NewMetersImportRecords[mCode]) {
              yr2026NewMetersImportRecords[mCode] = [];
            }
            yr2026NewMetersImportRecords[mCode].push({
              voucherCode: v.code,
              voucherDate: vDateStr,
              importReason: 'Hợp đồng mua sắm',
              contractNumber: contractNum,
              batchName: batchName,
              quantity: qty,
              unitPrice: det.unitPrice || 0,
              status: det.status || 'new',
            });
          }
        }
      }

      // Track export records for meters in 2026
      const yr2026NewMetersExportTotals: Record<string, number> = {};
      const yr2026MeterExportRecords: Record<string, MeterExportRecord[]> = {};
      for (const v of yr2026Vouchers) {
        const d = new Date(v.voucherDate);
        const vDateStr = v.voucherDate ? d.toLocaleDateString('vi-VN') : '';
        const mIdx = d.getMonth();
        const mName = MONTHS_LIST[mIdx];
        const destName = v.destinationUnit?.name || 'Chi nhánh / Đơn vị nhận';
        const unitKey = mapUnitToStandardKey(v.destinationUnit?.code, v.destinationUnit?.name);

        for (const det of (v.details || [])) {
          const rawCode = det.meter?.code;
          if (rawCode) {
            const qty = det.quantity || 0;
            const isNew = det.status === 'new';
            const mCode = (!isNew && standardMeters.some(m => m.code === `${rawCode}(SC)`))
              ? `${rawCode}(SC)`
              : rawCode;
            yr2026NewMetersExportTotals[mCode] = (yr2026NewMetersExportTotals[mCode] || 0) + qty;
            if (!yr2026MeterExportRecords[mCode]) yr2026MeterExportRecords[mCode] = [];
            yr2026MeterExportRecords[mCode].push({
              voucherCode: v.code,
              voucherDate: vDateStr,
              exportReason: 'Xuất cấp 12 đơn vị trực thuộc',
              destinationName: destName,
              quantity: qty,
              status: det.status || 'new',
              notes: det.notes || v.notes || '',
            });
          }
        }
      }

      // Track completed repairs entering circulating meter stock
      const yr2026SupplementExports: Record<string, number> = {};
      for (const r of yr2026Repairs) {
        if (r.status === 'completed' && r.meter?.code) {
          const rawCode = r.meter.code;
          const qty = r.completedQuantity || r.inputQuantity || 0;
          const rDateStr = (r.repairDate || r.createdAt) ? new Date(r.repairDate || r.createdAt).toLocaleDateString('vi-VN') : '';
          const isSupplement = r.notes?.includes('bổ sung') || r.code?.includes('BS');
          const cleanNote = r.notes?.replace(/\[Nguồn:[^\]]+\]\s*/, '') || 'Xuất bổ sung ĐH mới sang ĐH sửa chữa do thay đổi kế hoạch';

          // Repaired meters enter the repaired meter row (SC)
          const mCode = standardMeters.some(m => m.code === `${rawCode}(SC)`)
            ? `${rawCode}(SC)`
            : rawCode;

          yr2026NewMetersImportTotals[mCode] = (yr2026NewMetersImportTotals[mCode] || 0) + qty;
          if (!yr2026NewMetersImportRecords[mCode]) {
            yr2026NewMetersImportRecords[mCode] = [];
          }
          yr2026NewMetersImportRecords[mCode].push({
            voucherCode: r.code,
            voucherDate: rDateStr,
            importReason: isSupplement ? cleanNote : 'Xưởng sửa chữa hoàn tất',
            batchName: isSupplement ? 'Bổ sung ĐH Mới' : 'ĐH Quay vòng',
            quantity: qty,
            status: 'circulating',
          });

          if (isSupplement) {
            const match = r.notes?.match(/\[Nguồn:\s*([^\]]+)\]/);
            if (match && match[1]) {
              const srcCode = match[1].trim();
              yr2026SupplementExports[srcCode] = (yr2026SupplementExports[srcCode] || 0) + qty;

              if (!yr2026MeterExportRecords[srcCode]) yr2026MeterExportRecords[srcCode] = [];
              yr2026MeterExportRecords[srcCode].push({
                voucherCode: r.code,
                voucherDate: rDateStr,
                exportReason: 'Xuất bổ sung sang ĐH sửa chữa (thay đổi kế hoạch)',
                destinationName: `Xưởng sửa chữa (${r.meter?.name || 'ĐH sửa chữa'})`,
                quantity: qty,
                status: 'new',
                notes: cleanNote,
              });
            }
          }
        }
      }

      const yr2026NewPartsUsedTotals: Record<string, number> = {};
      const yr2026PartUsedRecords: Record<string, PartUsedRecord[]> = {};
      for (const r of yr2026Repairs) {
        const rDateStr = (r.repairDate || r.createdAt) ? new Date(r.repairDate || r.createdAt).toLocaleDateString('vi-VN') : '';
        for (const det of (r.sparePartUsages || [])) {
          if (det.sparePart?.name) {
            const pName = det.sparePart.name;
            const qty = det.quantity || 0;
            yr2026NewPartsUsedTotals[pName] = (yr2026NewPartsUsedTotals[pName] || 0) + qty;

            if (!yr2026PartUsedRecords[pName]) yr2026PartUsedRecords[pName] = [];
            yr2026PartUsedRecords[pName].push({
              voucherCode: r.code,
              voucherDate: rDateStr,
              meterName: r.meter?.name || 'Đồng hồ nước',
              quantity: qty,
              technicianName: r.technician?.name || r.user?.name || 'KTV Xưởng',
              notes: r.notes || '',
            });
          }
        }
      }

      // 2026 Meter Balances (from standardMeters + oracle totals + new imports from vouchers/repairs, with opening overrides)
      const yr2026MeterOverrides = openingOverrides?.meters?.['2026'] || {};
      const oracleMeterMap = new Map<string, any>();
      for (const om of (baseOracleMeters || [])) {
        oracleMeterMap.set(om.code, om);
      }

      const hasMeterVouchers = Object.keys(yr2026NewMetersImportTotals).length > 0 || Object.keys(yr2026NewMetersExportTotals).length > 0;
      const metersBal: MeterBalanceItem[] = standardMeters.map(sm => {
        const om = oracleMeterMap.get(sm.code);
        const baseImport = hasMeterVouchers ? 0 : (om?.import || 0);
        const newImport = yr2026NewMetersImportTotals[sm.code] || 0;
        const totalImport = baseImport + newImport;
        const rawOpening = yr2026MeterOverrides[sm.code] !== undefined ? yr2026MeterOverrides[sm.code] : (om?.opening || 0);
        const opening = rawOpening;
        const baseExp = hasMeterVouchers ? 0 : (om?.export || 0);
        const newExp = yr2026NewMetersExportTotals[sm.code] || 0;
        const suppExp = yr2026SupplementExports[sm.code] || 0;
        const exp = baseExp + newExp + suppExp;
        const ending = opening + totalImport - exp;
        const importRecords = yr2026NewMetersImportRecords[sm.code] || [];
        const exportRecords = yr2026MeterExportRecords[sm.code] || [];

        return {
          code: sm.code,
          name: sm.name,
          category: sm.category,
          unit: sm.unit,
          opening,
          import: totalImport,
          export: exp,
          ending,
          importRecords,
          exportRecords,
        };
      });
      metersBal.forEach(m => { previousMetersEnding[m.code] = m.ending; });

      // 2026 Parts Balances: Base oracle + live DB spare parts + new imports from vouchers, with opening overrides
      const yr2026PartOverrides = openingOverrides?.parts?.['2026'] || {};
      const oraclePartMap = new Map<string, any>();
      for (const op of (baseOracleParts || [])) {
        oraclePartMap.set(op.name, op);
      }

      const hasPartVouchers = Object.keys(yr2026NewPartsImportTotals).length > 0;
      const partsBal: PartBalanceItem[] = standardParts.map(sp => {
        const op = oraclePartMap.get(sp.name);
        const baseImport = hasPartVouchers ? 0 : (op?.total_import || 0);
        const newImport = yr2026NewPartsImportTotals[sp.name] || 0;
        const totalImport = baseImport + newImport;

        const baseUsed = op?.total_used || 0;
        const newUsed = yr2026NewPartsUsedTotals[sp.name] || 0;
        const totalUsed = baseUsed + newUsed;

        const rawOpening = yr2026PartOverrides[sp.name] !== undefined ? yr2026PartOverrides[sp.name] : (op?.opening || 0);
        const opening = rawOpening;
        const ending = opening + totalImport - totalUsed;
        const importRecords = yr2026NewPartsImportRecords[sp.name] || [];
        const usedRecords = yr2026PartUsedRecords[sp.name] || [];

        return {
          stt: sp.stt,
          name: sp.name,
          category: sp.category,
          price: sp.price,
          unit: sp.unit,
          opening,
          import: totalImport,
          used: totalUsed,
          ending,
          importRecords,
          usedRecords,
        };
      });
      partsBal.forEach(p => { previousPartsEnding[p.name] = p.ending; });

      // 2026 Used Meters Returns Matrix (12 Units)
      const clonedUsedUnits: Record<string, UnitReportData> = (base2026UnitMonthlyReturns && Object.keys(base2026UnitMonthlyReturns.units || {}).length > 0)
        ? JSON.parse(JSON.stringify(base2026UnitMonthlyReturns.units))
        : (() => {
            const m: Record<string, UnitReportData> = {};
            for (const u of STANDARD_UNIT_KEYS) {
              m[u.key] = {
                unitName: u.name,
                meters: standardMeters.map(sm => createEmptyMeterItem(sm.code, sm.name, sm.unit)),
              };
            }
            return m;
          })();

      // Merge newly added 2026 used meter vouchers
      const yr2026UsedImports = allImportVouchers.filter(v => {
        const d = new Date(v.voucherDate);
        return d.getFullYear() === 2026 && (v.importReason === 'old_meters_return' || v.importReason === 'repair_return');
      });

      for (const v of yr2026UsedImports) {
        const d = new Date(v.voucherDate);
        const mIdx = d.getMonth();
        const mName = MONTHS_LIST[mIdx];
        const unitKey = mapUnitToStandardKey(v.sourceUnit?.code, v.sourceUnit?.name);

        if (clonedUsedUnits[unitKey]) {
          for (const det of (v.details || [])) {
            const mCode = det.meter?.code;
            const qty = det.quantity || 0;
            const uMeter = clonedUsedUnits[unitKey].meters.find(m => m.code === mCode);
            if (uMeter) {
              if (!uMeter.months[mName]) uMeter.months[mName] = { circ: 0, new: 0, total: 0 };
              uMeter.months[mName].total += qty;
              uMeter.year_total.total += qty;
            }
          }
        }
      }

      const clonedUsedProducts: MeterReportItem[] = standardMeters.map(sm => {
        const item = createEmptyMeterItem(sm.code, sm.name, sm.unit);
        for (const u of Object.values(clonedUsedUnits)) {
          const uMeter = u.meters.find(m => m.code === sm.code);
          if (uMeter) {
            for (const mName of MONTHS_LIST) {
              const val = uMeter.months[mName]?.total || 0;
              item.months[mName].total += val;
              item.year_total.total += val;
            }
          }
        }
        return item;
      });

      const yr2026RepairsCompletedByMeter: Record<string, number> = {};
      const yr2026RepairsScrappedByMeter: Record<string, number> = {};
      for (const r of yr2026Repairs) {
        const mCode = r.meter?.code;
        if (mCode) {
          yr2026RepairsCompletedByMeter[mCode] = (yr2026RepairsCompletedByMeter[mCode] || 0) + (r.completedQuantity || 0);
          yr2026RepairsScrappedByMeter[mCode] = (yr2026RepairsScrappedByMeter[mCode] || 0) + (r.scrappedQuantity || 0);
        }
      }

      const usedMetersSummary2026: UsedMetersSummaryItem[] = standardMeters.map(sm => {
        const p = clonedUsedProducts.find(prod => prod.code === sm.code);
        const totalReceived = p?.year_total?.total || 0;
        const totalRepaired = yr2026RepairsCompletedByMeter[sm.code] || 0;
        const totalScrapped = yr2026RepairsScrappedByMeter[sm.code] || 0;
        const endingWaitingRepair = Math.max(0, totalReceived - totalRepaired - totalScrapped);
        return {
          code: sm.code,
          name: sm.name,
          unit: sm.unit,
          totalReceived,
          totalRepaired,
          totalScrapped,
          endingWaitingRepair,
        };
      });

      yearlyData[2026] = {
        months: MONTHS_LIST,
        units: clonedUnits,
        products: clonedProducts,
        metersBalance: metersBal,
        partsBalance: partsBal,
        usedMetersUnits: clonedUsedUnits,
        usedMetersProducts: clonedUsedProducts,
        usedMetersSummary: usedMetersSummary2026,
      };
    } else {
      // Any new year (2025, 2027, 2028, 2029...) initialized dynamically from DB transactions
      const unitsMap: Record<string, UnitReportData> = {};
      for (const u of STANDARD_UNIT_KEYS) {
        unitsMap[u.key] = {
          unitName: u.name,
          meters: standardMeters.map(m => createEmptyMeterItem(m.code, m.name, m.unit)),
        };
      }

      const productsList = standardMeters.map(m => createEmptyMeterItem(m.code, m.name, m.unit));

      // Filter export vouchers for this year
      const yrExports = allExportVouchers.filter(v => {
        const d = new Date(v.voucherDate);
        return d.getFullYear() === year;
      });

      // Filter import vouchers for this year
      const yrImports = allImportVouchers.filter(v => {
        const d = new Date(v.voucherDate);
        return d.getFullYear() === year;
      });

      // Filter repairs for this year
      const yrRepairs = allRepairVouchers.filter(v => {
        const d = new Date(v.repairDate || v.createdAt);
        return d.getFullYear() === year;
      });

      // Aggregate exports into 12 units
      const meterExportTotals: Record<string, number> = {};
      const meterExportRecords: Record<string, MeterExportRecord[]> = {};

      for (const v of yrExports) {
        const d = new Date(v.voucherDate);
        const vDateStr = v.voucherDate ? d.toLocaleDateString('vi-VN') : '';
        const mIdx = d.getMonth();
        const mName = MONTHS_LIST[mIdx];
        const unitKey = mapUnitToStandardKey(v.destinationUnit?.code, v.destinationUnit?.name);
        const destName = v.destinationUnit?.name || 'Chi nhánh / Đơn vị nhận';

        if (!unitsMap[unitKey]) {
          const foundStd = STANDARD_UNIT_KEYS.find(u => u.key === unitKey || u.name === v.destinationUnit?.name);
          const finalKey = foundStd ? foundStd.key : unitKey;
          if (!unitsMap[finalKey]) {
            unitsMap[finalKey] = {
              unitName: v.destinationUnit?.name || unitKey,
              meters: standardMeters.map(sm => createEmptyMeterItem(sm.code, sm.name, sm.unit)),
            };
          }
        }

        const targetUnit = unitsMap[unitKey] || unitsMap[mapUnitToStandardKey(v.destinationUnit?.code, v.destinationUnit?.name)];
        if (targetUnit) {
          for (const det of (v.details || [])) {
            const rawCode = det.meter?.code;
            if (!rawCode) continue;
            const isRepaired = isRepairedMeter(det.meter, det.status);
            const mCode = (isRepaired && standardMeters.some(m => m.code === `${rawCode}(SC)`))
              ? `${rawCode}(SC)`
              : rawCode;
            const qty = det.quantity || 0;

            meterExportTotals[mCode] = (meterExportTotals[mCode] || 0) + qty;

            if (!meterExportRecords[mCode]) meterExportRecords[mCode] = [];
            meterExportRecords[mCode].push({
              voucherCode: v.code,
              voucherDate: vDateStr,
              exportReason: 'Xuất cấp 12 đơn vị trực thuộc',
              destinationName: destName,
              quantity: qty,
              status: det.status || (isRepaired ? 'repaired' : 'new'),
              notes: det.notes || v.notes || '',
            });

            let uMeter = targetUnit.meters.find(m => m.code === mCode);
            if (!uMeter) {
              uMeter = createEmptyMeterItem(mCode, det.meter?.name || mCode, det.meter?.unit || 'Cái');
              targetUnit.meters.push(uMeter);
            }
            if (uMeter) {
              if (!uMeter.months[mName]) uMeter.months[mName] = { circ: 0, new: 0, total: 0 };
              if (isRepaired) {
                uMeter.months[mName].circ += qty;
                uMeter.year_total.circ += qty;
              } else {
                uMeter.months[mName].new += qty;
                uMeter.year_total.new += qty;
              }
              uMeter.months[mName].total += qty;
              uMeter.year_total.total += qty;
            }

            let pMeter = productsList.find(p => p.code === mCode);
            if (!pMeter) {
              pMeter = createEmptyMeterItem(mCode, det.meter?.name || mCode, det.meter?.unit || 'Cái');
              productsList.push(pMeter);
            }
            if (pMeter) {
              if (!pMeter.months[mName]) pMeter.months[mName] = { circ: 0, new: 0, total: 0 };
              if (isRepaired) {
                pMeter.months[mName].circ += qty;
                pMeter.year_total.circ += qty;
              } else {
                pMeter.months[mName].new += qty;
                pMeter.year_total.new += qty;
              }
              pMeter.months[mName].total += qty;
              pMeter.year_total.total += qty;
            }
          }
        }
      }

      // Aggregate meter imports in this year
      const meterImportTotals: Record<string, number> = {};
      const meterImportRecords: Record<string, MeterImportRecord[]> = {};

      for (const v of yrImports) {
        const vDateStr = v.voucherDate ? new Date(v.voucherDate).toLocaleDateString('vi-VN') : '';
        const contractNum = v.contract?.contractNumber || '';
        const batchName = v.batch?.batchName || (v.contractBatchId ? `Đợt ${v.contractBatchId}` : 'Nhập kho');

        for (const det of (v.details || [])) {
          if (det.meter?.code) {
            // Skip old meters returned from units (they are broken meters sent for inspection/repair)
            if (v.importReason === 'old_meters_return' || det.status === 'sent_for_repair') {
              continue;
            }
            const rawCode = det.meter.code;
            const isRepaired = det.status === 'circulating' || det.meter.category === 'Sửa chữa';
            const mCode = isRepaired && standardMeters.some(m => m.code === `${rawCode}(SC)`)
              ? `${rawCode}(SC)`
              : rawCode;
            const qty = det.quantity || 0;
            meterImportTotals[mCode] = (meterImportTotals[mCode] || 0) + qty;
            if (!meterImportRecords[mCode]) {
              meterImportRecords[mCode] = [];
            }
            meterImportRecords[mCode].push({
              voucherCode: v.code,
              voucherDate: vDateStr,
              importReason: 'Hợp đồng mua sắm',
              contractNumber: contractNum,
              batchName: batchName,
              quantity: qty,
              unitPrice: det.unitPrice || 0,
              status: det.status || 'new',
            });
          }
        }
      }
      // Add repaired meters entering circulating stock
      for (const r of yrRepairs) {
        if (r.status === 'completed' && r.meter?.code) {
          const rawCode = r.meter.code;
          const qty = r.completedQuantity || r.inputQuantity || 0;
          const rDateStr = (r.repairDate || r.createdAt) ? new Date(r.repairDate || r.createdAt).toLocaleDateString('vi-VN') : '';
          const isSupplement = r.notes?.includes('bổ sung') || r.code?.includes('BS');
          const cleanNote = r.notes?.replace(/\[Nguồn:[^\]]+\]\s*/, '') || 'Xuất bổ sung ĐH mới sang ĐH sửa chữa do thay đổi kế hoạch';

          const mCode = standardMeters.some(m => m.code === `${rawCode}(SC)`)
            ? `${rawCode}(SC)`
            : rawCode;

          meterImportTotals[mCode] = (meterImportTotals[mCode] || 0) + qty;
          if (!meterImportRecords[mCode]) {
            meterImportRecords[mCode] = [];
          }
          meterImportRecords[mCode].push({
            voucherCode: r.code,
            voucherDate: rDateStr,
            importReason: isSupplement ? cleanNote : 'Xưởng sửa chữa hoàn tất',
            batchName: isSupplement ? 'Bổ sung ĐH Mới' : 'ĐH Quay vòng',
            quantity: qty,
            status: 'circulating',
          });

          if (isSupplement) {
            const match = r.notes?.match(/\[Nguồn:\s*([^\]]+)\]/);
            if (match && match[1]) {
              const srcCode = match[1].trim();
              meterExportTotals[srcCode] = (meterExportTotals[srcCode] || 0) + qty;

              if (!meterExportRecords[srcCode]) meterExportRecords[srcCode] = [];
              meterExportRecords[srcCode].push({
                voucherCode: r.code,
                voucherDate: rDateStr,
                exportReason: 'Xuất bổ sung sang ĐH sửa chữa (thay đổi kế hoạch)',
                destinationName: `Xưởng sửa chữa (${r.meter?.name || 'ĐH sửa chữa'})`,
                quantity: qty,
                status: 'new',
                notes: cleanNote,
              });
            }
          }
        }
      }

      // Aggregate parts imports & usage in this year
      const partsImportTotals: Record<string, number> = {};
      const partsImportRecords: Record<string, PartImportRecord[]> = {};

      for (const v of yrImports) {
        const vDateStr = v.voucherDate ? new Date(v.voucherDate).toLocaleDateString('vi-VN') : '';
        const contractNum = v.contract?.contractNumber || '';
        const batchName = v.batch?.batchName || (v.contractBatchId ? `Đợt ${v.contractBatchId}` : 'Nhập kho');

        for (const det of (v.details || [])) {
          if (det.sparePart?.name) {
            const pName = det.sparePart.name;
            const qty = det.quantity || 0;
            partsImportTotals[pName] = (partsImportTotals[pName] || 0) + qty;
            if (!partsImportRecords[pName]) {
              partsImportRecords[pName] = [];
            }
            partsImportRecords[pName].push({
              voucherCode: v.code,
              voucherDate: vDateStr,
              contractNumber: contractNum,
              batchName: batchName,
              quantity: qty,
              unitPrice: det.unitPrice || 0,
            });
          }
        }
      }

      const partsUsedTotals: Record<string, number> = {};
      const partsUsedRecords: Record<string, PartUsedRecord[]> = {};
      for (const r of yrRepairs) {
        const rDateStr = (r.repairDate || r.createdAt) ? new Date(r.repairDate || r.createdAt).toLocaleDateString('vi-VN') : '';
        for (const det of (r.sparePartUsages || [])) {
          if (det.sparePart?.name) {
            const pName = det.sparePart.name;
            const qty = det.quantity || 0;
            partsUsedTotals[pName] = (partsUsedTotals[pName] || 0) + qty;

            if (!partsUsedRecords[pName]) partsUsedRecords[pName] = [];
            partsUsedRecords[pName].push({
              voucherCode: r.code,
              voucherDate: rDateStr,
              meterName: r.meter?.name || 'Đồng hồ nước',
              quantity: qty,
              technicianName: r.technician?.name || r.user?.name || 'KTV Xưởng',
              notes: r.notes || '',
            });
          }
        }
      }

      // Meter balances for this year: opening carries over from previous year ending or specific year override
      const yrMeterOverrides = openingOverrides?.meters?.[String(year)] || {};
      const metersBal: MeterBalanceItem[] = standardMeters.map(m => {
        const defaultOpening = previousMetersEnding[m.code] || 0;
        const opening = yrMeterOverrides[m.code] !== undefined ? yrMeterOverrides[m.code] : defaultOpening;
        const imp = meterImportTotals[m.code] || 0;
        const exp = meterExportTotals[m.code] || 0;
        const ending = opening + imp - exp;
        previousMetersEnding[m.code] = ending;
        const importRecords = meterImportRecords[m.code] || [];
        const exportRecords = meterExportRecords[m.code] || [];
        return {
          code: m.code,
          name: m.name,
          category: m.category,
          unit: m.unit,
          opening,
          import: imp,
          export: exp,
          ending,
          importRecords,
          exportRecords,
        };
      });

      // Parts balances for this year: opening carries over from previous year ending or specific year override
      const yrPartOverrides = openingOverrides?.parts?.[String(year)] || {};
      const partsBal: PartBalanceItem[] = standardParts.map((p) => {
        const defaultOpening = previousPartsEnding[p.name] || 0;
        const opening = yrPartOverrides[p.name] !== undefined ? yrPartOverrides[p.name] : defaultOpening;
        const imp = partsImportTotals[p.name] || 0;
        const used = partsUsedTotals[p.name] || 0;
        const ending = opening + imp - used;
        previousPartsEnding[p.name] = ending;
        const importRecords = partsImportRecords[p.name] || [];
        const usedRecords = partsUsedRecords[p.name] || [];
        return {
          stt: p.stt,
          name: p.name,
          category: p.category,
          price: p.price || 0,
          unit: p.unit || 'Cái',
          opening,
          import: imp,
          used,
          ending,
          importRecords,
          usedRecords,
        };
      });

      // Used Meters returns for this year
      const yrUsedUnits: Record<string, UnitReportData> = {};
      for (const u of STANDARD_UNIT_KEYS) {
        yrUsedUnits[u.key] = {
          unitName: u.name,
          meters: standardMeters.map(m => createEmptyMeterItem(m.code, m.name, m.unit)),
        };
      }

      const yrUsedImports = allImportVouchers.filter(v => {
        const d = new Date(v.voucherDate);
        return d.getFullYear() === year && (v.importReason === 'old_meters_return' || v.importReason === 'repair_return');
      });

      for (const v of yrUsedImports) {
        const d = new Date(v.voucherDate);
        const mIdx = d.getMonth();
        const mName = MONTHS_LIST[mIdx];
        const unitKey = mapUnitToStandardKey(v.sourceUnit?.code, v.sourceUnit?.name);

        if (yrUsedUnits[unitKey]) {
          for (const det of (v.details || [])) {
            const mCode = det.meter?.code;
            const qty = det.quantity || 0;
            const uMeter = yrUsedUnits[unitKey].meters.find(m => m.code === mCode);
            if (uMeter) {
              if (!uMeter.months[mName]) uMeter.months[mName] = { circ: 0, new: 0, total: 0 };
              uMeter.months[mName].total += qty;
              uMeter.year_total.total += qty;
            }
          }
        }
      }

      const yrUsedProducts: MeterReportItem[] = standardMeters.map(sm => {
        const item = createEmptyMeterItem(sm.code, sm.name, sm.unit);
        for (const u of Object.values(yrUsedUnits)) {
          const uMeter = u.meters.find(m => m.code === sm.code);
          if (uMeter) {
            for (const mName of MONTHS_LIST) {
              const val = uMeter.months[mName]?.total || 0;
              item.months[mName].total += val;
              item.year_total.total += val;
            }
          }
        }
        return item;
      });

      const yrRepairsCompletedByMeter: Record<string, number> = {};
      const yrRepairsScrappedByMeter: Record<string, number> = {};
      for (const r of yrRepairs) {
        const mCode = r.meter?.code;
        if (mCode) {
          yrRepairsCompletedByMeter[mCode] = (yrRepairsCompletedByMeter[mCode] || 0) + (r.completedQuantity || 0);
          yrRepairsScrappedByMeter[mCode] = (yrRepairsScrappedByMeter[mCode] || 0) + (r.scrappedQuantity || 0);
        }
      }

      const yrUsedMetersSummary: UsedMetersSummaryItem[] = standardMeters.map(sm => {
        const p = yrUsedProducts.find(prod => prod.code === sm.code);
        const totalReceived = p?.year_total?.total || 0;
        const totalRepaired = yrRepairsCompletedByMeter[sm.code] || 0;
        const totalScrapped = yrRepairsScrappedByMeter[sm.code] || 0;
        const endingWaitingRepair = Math.max(0, totalReceived - totalRepaired - totalScrapped);
        return {
          code: sm.code,
          name: sm.name,
          unit: sm.unit,
          totalReceived,
          totalRepaired,
          totalScrapped,
          endingWaitingRepair,
        };
      });

      yearlyData[year] = {
        months: MONTHS_LIST,
        units: unitsMap,
        products: productsList,
        metersBalance: metersBal,
        partsBalance: partsBal,
        usedMetersUnits: yrUsedUnits,
        usedMetersProducts: yrUsedProducts,
        usedMetersSummary: yrUsedMetersSummary,
      };
    }
  }

  return {
    availableYears,
    yearlyData,
  };
}
