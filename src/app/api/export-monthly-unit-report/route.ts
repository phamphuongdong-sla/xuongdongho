import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import unitMonthlyExportsData from '@/data/unit-monthly-exports.json';
import { 
  extractMeterDN, 
  isRepairedMeter, 
  DN_ORDER_MAP, 
  STANDARD_UNIT_KEYS,
  mapUnitToStandardKey 
} from '@/services/reports.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '2026', 10);
    const month = parseInt(searchParams.get('month') || '8', 10);
    const onlyActive = searchParams.get('onlyActive') !== 'false'; // default true
    const creatorName = searchParams.get('creatorName') || 'Đồng Đức Anh';
    const deptManagerName = searchParams.get('deptManagerName') || 'Phạm Phương Đông';

    const monthName = `Tháng ${month}`;

    // 1. Fetch 12 units
    const units = await prisma.unit.findMany({
      where: { code: { not: 'KHO-VP' } },
      orderBy: { sortOrder: 'asc' },
    });

    // 2. Fetch export vouchers for this month & year
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const exportVouchers = await prisma.exportVoucher.findMany({
      where: {
        destinationUnitId: { not: null },
        voucherDate: { gte: startDate, lte: endDate },
      },
      include: {
        destinationUnit: true,
        details: { include: { meter: true } },
      },
    });

    // 3. For 2026: also load unitMonthlyExports fixture
    let base2026UnitExports: any = null;
    if (year === 2026) {
      base2026UnitExports = unitMonthlyExportsData;
    }

    // 4. Matrix of unit values: unitKey -> { repaired: Record<dn, qty>, new: Record<dn, qty>, notes: string[] }
    const unitDataMap: Record<string, {
      unitName: string;
      repaired: Record<string, number>;
      new: Record<string, number>;
      notes: string[];
    }> = {};

    for (const u of units) {
      unitDataMap[u.code] = {
        unitName: u.name,
        repaired: {},
        new: {},
        notes: [],
      };
    }

    // A. Aggregate baseline 2026 fixture
    if (base2026UnitExports && base2026UnitExports.units) {
      for (const std of STANDARD_UNIT_KEYS) {
        const uFixture = base2026UnitExports.units[std.key];
        const matchingUnit = units.find(u => mapUnitToStandardKey(u.code, u.name) === std.key);
        const targetKey = matchingUnit ? matchingUnit.code : std.key;
        if (!unitDataMap[targetKey]) {
          unitDataMap[targetKey] = {
            unitName: matchingUnit?.name || std.name,
            repaired: {},
            new: {},
            notes: [],
          };
        }

        if (uFixture && uFixture.meters) {
          for (const m of uFixture.meters) {
            const mData = m.months?.[monthName];
            if (mData) {
              const dn = extractMeterDN(m.code, m.name);
              const isMeterRep = isRepairedMeter(m);

              if (isMeterRep) {
                const qty = (mData.circ || 0) + (mData.new || 0);
                if (qty > 0) {
                  unitDataMap[targetKey].repaired[dn] = (unitDataMap[targetKey].repaired[dn] || 0) + qty;
                }
              } else {
                if (mData.circ > 0) {
                  unitDataMap[targetKey].repaired[dn] = (unitDataMap[targetKey].repaired[dn] || 0) + mData.circ;
                }
                if (mData.new > 0) {
                  unitDataMap[targetKey].new[dn] = (unitDataMap[targetKey].new[dn] || 0) + mData.new;
                }
              }
            }
          }
        }
      }
    }

    // B. Aggregate live export vouchers
    for (const v of exportVouchers) {
      const uCode = v.destinationUnit?.code;
      if (!uCode || !unitDataMap[uCode]) continue;

      if (v.notes && !unitDataMap[uCode].notes.includes(v.notes)) {
        unitDataMap[uCode].notes.push(v.notes);
      }

      for (const det of (v.details || [])) {
        const qty = det.quantity || 0;
        if (qty <= 0) continue;
        const dn = extractMeterDN(det.meter?.code, det.meter?.name);
        const isRepaired = isRepairedMeter(det.meter, det.status);

        if (isRepaired) {
          unitDataMap[uCode].repaired[dn] = (unitDataMap[uCode].repaired[dn] || 0) + qty;
        } else {
          unitDataMap[uCode].new[dn] = (unitDataMap[uCode].new[dn] || 0) + qty;
        }
      }
    }

    // 5. Determine active columns
    const totalRepairedByDN: Record<string, number> = {};
    const totalNewByDN: Record<string, number> = {};

    for (const u of units) {
      const uData = unitDataMap[u.code];
      if (!uData) continue;
      for (const [dn, qty] of Object.entries(uData.repaired)) {
        totalRepairedByDN[dn] = (totalRepairedByDN[dn] || 0) + qty;
      }
      for (const [dn, qty] of Object.entries(uData.new)) {
        totalNewByDN[dn] = (totalNewByDN[dn] || 0) + qty;
      }
    }

    const sortDNs = (dns: string[]) => {
      return [...dns].sort((a, b) => (DN_ORDER_MAP[a] || 999) - (DN_ORDER_MAP[b] || 999));
    };

    let repairedDNs: string[];
    let newDNs: string[];

    if (onlyActive) {
      const actRep = Object.keys(totalRepairedByDN).filter(dn => (totalRepairedByDN[dn] || 0) > 0);
      const actNew = Object.keys(totalNewByDN).filter(dn => (totalNewByDN[dn] || 0) > 0);

      repairedDNs = sortDNs(actRep);
      newDNs = sortDNs(actNew);
    } else {
      repairedDNs = ['DN15', 'DN20', 'DN25', 'DN32', 'DN40', 'DN50'];
      newDNs = ['DN15', 'DN20', 'DN25', 'DN32', 'DN40', 'DN50', 'DN80', 'DN150', 'DN200'];
    }

    // 6. Build Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SOWASUCO WM';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(`Tháng ${month}-${year}`, {
      views: [{ showGridLines: true }],
      pageSetup: {
        orientation: 'landscape',
        paperSize: 9, // A4
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    // Column positions setup
    const repStartCol = 3;
    const repEndCol = repStartCol + (repairedDNs.length > 0 ? repairedDNs.length : 0); // includes Cộng column
    const repCộngCol = repEndCol;

    const newStartCol = repEndCol + 1;
    const newEndCol = newStartCol + (newDNs.length > 0 ? newDNs.length : 0); // includes Cộng column
    const newCộngCol = newEndCol;

    const grandTotalCol = newEndCol + 1;
    const noteCol = grandTotalCol + 1;
    const totalCols = noteCol;

    // Row 1 & 2: Header
    sheet.getCell('A1').value = 'Công ty cổ phần cấp nước Sơn La';
    sheet.getCell('A1').font = { name: 'Times New Roman', size: 11 };
    sheet.getCell('A2').value = 'XƯỞNG ĐỒNG HỒ';
    sheet.getCell('A2').font = { name: 'Times New Roman', size: 11, bold: true };

    // Row 4: Title
    sheet.mergeCells(4, 1, 4, totalCols);
    const titleCell = sheet.getCell(4, 1);
    titleCell.value = `SỐ LƯỢNG ĐỒNG HỒ ĐÃ XUẤT THÁNG ${month}-${year}`;
    titleCell.font = { name: 'Times New Roman', size: 15, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(4).height = 28;

    // Row 6 & 7: Table Headers
    const r6 = sheet.getRow(6);
    const r7 = sheet.getRow(7);
    r6.height = 24;
    r7.height = 24;

    sheet.mergeCells(6, 1, 7, 1);
    sheet.getCell(6, 1).value = 'STT';

    sheet.mergeCells(6, 2, 7, 2);
    sheet.getCell(6, 2).value = 'TÊN ĐƠN VỊ';

    // Group 1: Đồng hồ sửa chữa
    if (repairedDNs.length > 0) {
      sheet.mergeCells(6, repStartCol, 6, repEndCol);
      sheet.getCell(6, repStartCol).value = 'ĐỒNG HỒ SỬA CHỮA';
      repairedDNs.forEach((dn, idx) => {
        sheet.getCell(7, repStartCol + idx).value = dn;
      });
      sheet.getCell(7, repCộngCol).value = 'Cộng';
    } else {
      sheet.getCell(6, repStartCol).value = 'ĐỒNG HỒ SỬA CHỮA';
      sheet.getCell(7, repStartCol).value = 'Cộng';
    }

    // Group 2: Đồng hồ mới
    if (newDNs.length > 0) {
      sheet.mergeCells(6, newStartCol, 6, newEndCol);
      sheet.getCell(6, newStartCol).value = 'ĐỒNG HỒ MỚI';
      newDNs.forEach((dn, idx) => {
        sheet.getCell(7, newStartCol + idx).value = dn;
      });
      sheet.getCell(7, newCộngCol).value = 'Cộng';
    } else {
      sheet.getCell(6, newStartCol).value = 'ĐỒNG HỒ MỚI';
      sheet.getCell(7, newStartCol).value = 'Cộng';
    }

    // Tổng cộng
    sheet.mergeCells(6, grandTotalCol, 7, grandTotalCol);
    sheet.getCell(6, grandTotalCol).value = 'TỔNG CỘNG';

    // Ghi chú
    sheet.mergeCells(6, noteCol, 7, noteCol);
    sheet.getCell(6, noteCol).value = 'GHI CHÚ';

    // Style Header Cells
    for (let r = 6; r <= 7; r++) {
      for (let c = 1; c <= totalCols; c++) {
        const cell = sheet.getCell(r, c);
        cell.font = { name: 'Times New Roman', size: 11, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    }

    // Set Column Widths
    sheet.getColumn(1).width = 6;
    sheet.getColumn(2).width = 24;
    for (let c = 3; c <= repEndCol; c++) sheet.getColumn(c).width = 9;
    for (let c = newStartCol; c <= newEndCol; c++) sheet.getColumn(c).width = 9;
    sheet.getColumn(grandTotalCol).width = 13;
    sheet.getColumn(noteCol).width = 24;

    // Data Rows (12 units)
    let currentRow = 8;
    units.forEach((u, index) => {
      const uData = unitDataMap[u.code] || { repaired: {}, new: {}, notes: [] };
      const row = sheet.getRow(currentRow);
      row.height = 22;

      sheet.getCell(currentRow, 1).value = index + 1;
      sheet.getCell(currentRow, 1).alignment = { horizontal: 'center', vertical: 'middle' };

      sheet.getCell(currentRow, 2).value = u.name;
      sheet.getCell(currentRow, 2).alignment = { horizontal: 'left', vertical: 'middle' };

      // Repaired DNs
      let subtotalRep = 0;
      repairedDNs.forEach((dn, idx) => {
        const val = uData.repaired[dn] || 0;
        subtotalRep += val;
        const c = sheet.getCell(currentRow, repStartCol + idx);
        c.value = val > 0 ? val : null;
        c.alignment = { horizontal: 'right', vertical: 'middle' };
        c.numFmt = '#,##0';
      });
      // Repaired Cộng cell
      const cellRepCộng = sheet.getCell(currentRow, repCộngCol);
      cellRepCộng.value = subtotalRep > 0 ? subtotalRep : null;
      cellRepCộng.alignment = { horizontal: 'right', vertical: 'middle' };
      cellRepCộng.font = { name: 'Times New Roman', size: 11, bold: true };
      cellRepCộng.numFmt = '#,##0';

      // New DNs
      let subtotalNew = 0;
      newDNs.forEach((dn, idx) => {
        const val = uData.new[dn] || 0;
        subtotalNew += val;
        const c = sheet.getCell(currentRow, newStartCol + idx);
        c.value = val > 0 ? val : null;
        c.alignment = { horizontal: 'right', vertical: 'middle' };
        c.numFmt = '#,##0';
      });
      // New Cộng cell
      const cellNewCộng = sheet.getCell(currentRow, newCộngCol);
      cellNewCộng.value = subtotalNew > 0 ? subtotalNew : null;
      cellNewCộng.alignment = { horizontal: 'right', vertical: 'middle' };
      cellNewCộng.font = { name: 'Times New Roman', size: 11, bold: true };
      cellNewCộng.numFmt = '#,##0';

      // Grand total
      const rowGrandTotal = subtotalRep + subtotalNew;
      const cellGrandTotal = sheet.getCell(currentRow, grandTotalCol);
      cellGrandTotal.value = rowGrandTotal > 0 ? rowGrandTotal : null;
      cellGrandTotal.alignment = { horizontal: 'right', vertical: 'middle' };
      cellGrandTotal.font = { name: 'Times New Roman', size: 11, bold: true };
      cellGrandTotal.numFmt = '#,##0';

      // Ghi chú
      sheet.getCell(currentRow, noteCol).value = uData.notes.join('; ');
      sheet.getCell(currentRow, noteCol).alignment = { horizontal: 'left', vertical: 'middle' };

      for (let c = 1; c <= totalCols; c++) {
        const cell = sheet.getCell(currentRow, c);
        if (!cell.font) cell.font = { name: 'Times New Roman', size: 11 };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }

      currentRow++;
    });

    // Total Row
    const totalRowIndex = currentRow;
    const totalRow = sheet.getRow(totalRowIndex);
    totalRow.height = 24;

    sheet.mergeCells(totalRowIndex, 1, totalRowIndex, 2);
    sheet.getCell(totalRowIndex, 1).value = 'CỘNG';
    sheet.getCell(totalRowIndex, 1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Formulas for totals
    for (let c = 3; c <= grandTotalCol; c++) {
      const colLetter = sheet.getColumn(c).letter;
      const cell = sheet.getCell(totalRowIndex, c);
      cell.value = {
        formula: `SUM(${colLetter}8:${colLetter}${totalRowIndex - 1})`,
        result: 0,
      };
      cell.font = { name: 'Times New Roman', size: 11, bold: true };
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.numFmt = '#,##0';
    }

    for (let c = 1; c <= totalCols; c++) {
      const cell = sheet.getCell(totalRowIndex, c);
      cell.font = { name: 'Times New Roman', size: 11, bold: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'double' },
        right: { style: 'thin' },
      };
    }

    // Signatures Block
    const signTitleRow = totalRowIndex + 2;
    const signNameRow = signTitleRow + 4;

    const leftSignCol = Math.max(2, Math.floor((repStartCol + repEndCol) / 2));
    sheet.getCell(signTitleRow, leftSignCol).value = 'Trưởng phòng';
    sheet.getCell(signTitleRow, leftSignCol).font = { name: 'Times New Roman', size: 12, bold: true };
    sheet.getCell(signTitleRow, leftSignCol).alignment = { horizontal: 'center' };

    sheet.getCell(signNameRow, leftSignCol).value = deptManagerName;
    sheet.getCell(signNameRow, leftSignCol).font = { name: 'Times New Roman', size: 12, bold: true };
    sheet.getCell(signNameRow, leftSignCol).alignment = { horizontal: 'center' };

    const rightSignCol = Math.min(totalCols, Math.max(newStartCol, Math.floor((newStartCol + grandTotalCol) / 2)));
    sheet.getCell(signTitleRow, rightSignCol).value = 'Người lập';
    sheet.getCell(signTitleRow, rightSignCol).font = { name: 'Times New Roman', size: 12, bold: true };
    sheet.getCell(signTitleRow, rightSignCol).alignment = { horizontal: 'center' };

    sheet.getCell(signNameRow, rightSignCol).value = creatorName;
    sheet.getCell(signNameRow, rightSignCol).font = { name: 'Times New Roman', size: 12, bold: true };
    sheet.getCell(signNameRow, rightSignCol).alignment = { horizontal: 'center' };

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="So_Luong_Dong_Ho_Da_Xuat_Thang_${month}_${year}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting monthly unit report:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi xuất file Excel' }, { status: 500 });
  }
}
