import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

interface TimelineRow {
  stt: number;
  unitName: string;
  months: number[];
  total: number;
  planMonth: number;
  planYear: number;
  remaining: number;
}

interface MatrixRow {
  stt: number;
  name: string;
  unit: string;
  values: number[];
  total: number;
}

interface ReportPayload {
  reportType: 'export_timeline' | 'used_timeline' | 'matrix';
  title: string;
  subtitle?: string;
  year: number;
  productName?: string;
  matrixHeaders?: string[];
  matrixRows?: MatrixRow[];
  matrixTotals?: {
    values: number[];
    total: number;
  };
  rows?: TimelineRow[];
  totals?: {
    months: number[];
    total: number;
    planMonth: number;
    planYear: number;
    remaining: number;
  };
  creatorName?: string;
  deptManagerName?: string;
  workshopManagerName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ReportPayload = await request.json();
    const {
      reportType,
      title,
      subtitle,
      year,
      productName,
      matrixHeaders = [],
      matrixRows = [],
      matrixTotals,
      rows = [],
      totals,
      creatorName = 'Đồng Đức Anh',
      deptManagerName = 'Phạm Phương Đông',
      workshopManagerName = 'Bùi Đức Duy',
    } = data;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SOWASUCO WM System';
    workbook.created = new Date();

    const todayStr = new Date().toLocaleDateString('vi-VN');

    // ==========================================
    // 1. CASE: MATRIX REPORT
    // ==========================================
    if (reportType === 'matrix') {
      const sheetName = `Tổng Hợp ${year}`;
      const totalCols = matrixHeaders.length > 0 ? matrixHeaders.length : 16;

      const sheet = workbook.addWorksheet(sheetName, {
        views: [{ showGridLines: true }],
        pageSetup: {
          orientation: 'landscape',
          paperSize: 9, // A4
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
        },
      });

      // Column widths
      sheet.getColumn(1).width = 6;  // STT
      sheet.getColumn(2).width = 30; // Loại đồng hồ
      sheet.getColumn(3).width = 8;  // ĐVT
      for (let c = 4; c < totalCols; c++) {
        sheet.getColumn(c).width = 8.5; // 12 đơn vị
      }
      sheet.getColumn(totalCols).width = 14; // Tổng cộng

      // Company header
      sheet.getCell('A1').value = 'Công ty cổ phần cấp nước Sơn La';
      sheet.getCell('A1').font = { name: 'Times New Roman', size: 11 };
      sheet.getCell('A2').value = 'XƯỞNG ĐỒNG HỒ NƯỚC';
      sheet.getCell('A2').font = { name: 'Times New Roman', size: 11, bold: true };

      const rightColLetter = sheet.getColumn(totalCols).letter;
      sheet.getCell(`${rightColLetter}1`).value = `Ngày xuất: ${todayStr}`;
      sheet.getCell(`${rightColLetter}1`).font = { name: 'Times New Roman', size: 10, italic: true };
      sheet.getCell(`${rightColLetter}1`).alignment = { horizontal: 'right' };

      // Title & Subtitle
      sheet.mergeCells(4, 1, 4, totalCols);
      const titleCell = sheet.getCell(4, 1);
      titleCell.value = title;
      titleCell.font = { name: 'Times New Roman', size: 15, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(4).height = 26;

      if (subtitle) {
        sheet.mergeCells(5, 1, 5, totalCols);
        const subCell = sheet.getCell(5, 1);
        subCell.value = subtitle;
        subCell.font = { name: 'Times New Roman', size: 11, italic: true };
        subCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(5).height = 18;
      }

      // Headers (Row 7)
      const headerRow = sheet.getRow(7);
      headerRow.height = 28;
      matrixHeaders.forEach((h, idx) => {
        const cell = sheet.getCell(7, idx + 1);
        cell.value = h;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF1E293B' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx + 1 === totalCols ? 'FFE0E7FF' : 'FFF1F5F9' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF94A3B8' } },
          left: { style: 'thin', color: { argb: 'FF94A3B8' } },
          bottom: { style: 'medium', color: { argb: 'FF475569' } },
          right: { style: 'thin', color: { argb: 'FF94A3B8' } },
        };
      });

      // Data rows
      let currentRow = 8;
      matrixRows.forEach((r) => {
        const row = sheet.getRow(currentRow);
        row.height = 20;

        const c1 = sheet.getCell(currentRow, 1);
        c1.value = r.stt;
        c1.alignment = { horizontal: 'center', vertical: 'middle' };
        c1.font = { name: 'Times New Roman', size: 10 };

        const c2 = sheet.getCell(currentRow, 2);
        c2.value = r.name;
        c2.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        c2.font = { name: 'Times New Roman', size: 10, bold: true };

        const c3 = sheet.getCell(currentRow, 3);
        c3.value = r.unit || 'Cái';
        c3.alignment = { horizontal: 'center', vertical: 'middle' };
        c3.font = { name: 'Times New Roman', size: 10 };

        r.values.forEach((v, vIdx) => {
          const cUnit = sheet.getCell(currentRow, vIdx + 4);
          cUnit.value = v > 0 ? v : '-';
          cUnit.alignment = { horizontal: 'center', vertical: 'middle' };
          cUnit.font = { name: 'Times New Roman', size: 10, color: v > 0 ? { argb: 'FF0F172A' } : { argb: 'FF94A3B8' } };
          if (v > 0) cUnit.numFmt = '#,##0';
        });

        const cTot = sheet.getCell(currentRow, totalCols);
        cTot.value = r.total > 0 ? r.total : '-';
        cTot.alignment = { horizontal: 'right', vertical: 'middle' };
        cTot.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF1E293B' } };
        cTot.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        if (r.total > 0) cTot.numFmt = '#,##0';

        for (let c = 1; c <= totalCols; c++) {
          const cell = sheet.getCell(currentRow, c);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
        }
        currentRow++;
      });

      // Total Row
      const totRowIndex = currentRow;
      const totRow = sheet.getRow(totRowIndex);
      totRow.height = 24;

      sheet.mergeCells(totRowIndex, 1, totRowIndex, 3);
      const cTotTitle = sheet.getCell(totRowIndex, 1);
      cTotTitle.value = 'TỔNG CỘNG';
      cTotTitle.alignment = { horizontal: 'center', vertical: 'middle' };
      cTotTitle.font = { name: 'Times New Roman', size: 11, bold: true };

      (matrixTotals?.values || []).forEach((v, vIdx) => {
        const cell = sheet.getCell(totRowIndex, vIdx + 4);
        cell.value = v > 0 ? v : '-';
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Times New Roman', size: 10, bold: true };
        if (v > 0) cell.numFmt = '#,##0';
      });

      const cGrandTot = sheet.getCell(totRowIndex, totalCols);
      cGrandTot.value = matrixTotals?.total || 0;
      cGrandTot.alignment = { horizontal: 'right', vertical: 'middle' };
      cGrandTot.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF1E293B' } };
      cGrandTot.numFmt = '#,##0';

      for (let c = 1; c <= totalCols; c++) {
        const cell = sheet.getCell(totRowIndex, c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF475569' } },
          left: { style: 'thin', color: { argb: 'FF94A3B8' } },
          bottom: { style: 'double', color: { argb: 'FF1E293B' } },
          right: { style: 'thin', color: { argb: 'FF94A3B8' } },
        };
      }

      // Signatures
      const signTitleRow = totRowIndex + 3;
      const signSubRow = signTitleRow + 1;
      const signNameRow = signTitleRow + 5;

      sheet.mergeCells(signTitleRow, 2, signTitleRow, 4);
      sheet.getCell(signTitleRow, 2).value = 'TRƯỞNG PHÒNG';
      sheet.getCell(signTitleRow, 2).font = { name: 'Times New Roman', size: 11, bold: true };
      sheet.getCell(signTitleRow, 2).alignment = { horizontal: 'center' };
      sheet.mergeCells(signSubRow, 2, signSubRow, 4);
      sheet.getCell(signSubRow, 2).value = '(Ký, ghi rõ họ tên)';
      sheet.getCell(signSubRow, 2).font = { name: 'Times New Roman', size: 10, italic: true };
      sheet.getCell(signSubRow, 2).alignment = { horizontal: 'center' };
      sheet.mergeCells(signNameRow, 2, signNameRow, 4);
      sheet.getCell(signNameRow, 2).value = deptManagerName;
      sheet.getCell(signNameRow, 2).font = { name: 'Times New Roman', size: 11, bold: true };
      sheet.getCell(signNameRow, 2).alignment = { horizontal: 'center' };

      const midCol = Math.floor(totalCols / 2);
      sheet.mergeCells(signTitleRow, midCol - 1, signTitleRow, midCol + 1);
      sheet.getCell(signTitleRow, midCol - 1).value = 'PHỤ TRÁCH XƯỞNG';
      sheet.getCell(signTitleRow, midCol - 1).font = { name: 'Times New Roman', size: 11, bold: true };
      sheet.getCell(signTitleRow, midCol - 1).alignment = { horizontal: 'center' };
      sheet.mergeCells(signSubRow, midCol - 1, signSubRow, midCol + 1);
      sheet.getCell(signSubRow, midCol - 1).value = '(Ký, ghi rõ họ tên)';
      sheet.getCell(signSubRow, midCol - 1).font = { name: 'Times New Roman', size: 10, italic: true };
      sheet.getCell(signSubRow, midCol - 1).alignment = { horizontal: 'center' };
      sheet.mergeCells(signNameRow, midCol - 1, signNameRow, midCol + 1);
      sheet.getCell(signNameRow, midCol - 1).value = workshopManagerName;
      sheet.getCell(signNameRow, midCol - 1).font = { name: 'Times New Roman', size: 11, bold: true };
      sheet.getCell(signNameRow, midCol - 1).alignment = { horizontal: 'center' };

      const endCol = totalCols;
      const startEndCol = Math.max(endCol - 3, midCol + 2);
      const signDateRow = signTitleRow - 1;
      sheet.mergeCells(signDateRow, startEndCol, signDateRow, endCol);
      sheet.getCell(signDateRow, startEndCol).value = `Sơn La, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${year}`;
      sheet.getCell(signDateRow, startEndCol).font = { name: 'Times New Roman', size: 10, italic: true };
      sheet.getCell(signDateRow, startEndCol).alignment = { horizontal: 'center' };

      sheet.mergeCells(signTitleRow, startEndCol, signTitleRow, endCol);
      sheet.getCell(signTitleRow, startEndCol).value = 'NGƯỜI LẬP BIỂU';
      sheet.getCell(signTitleRow, startEndCol).font = { name: 'Times New Roman', size: 11, bold: true };
      sheet.getCell(signTitleRow, startEndCol).alignment = { horizontal: 'center' };
      sheet.mergeCells(signSubRow, startEndCol, signSubRow, endCol);
      sheet.getCell(signSubRow, startEndCol).value = '(Ký, ghi rõ họ tên)';
      sheet.getCell(signSubRow, startEndCol).font = { name: 'Times New Roman', size: 10, italic: true };
      sheet.getCell(signSubRow, startEndCol).alignment = { horizontal: 'center' };
      sheet.mergeCells(signNameRow, startEndCol, signNameRow, endCol);
      sheet.getCell(signNameRow, startEndCol).value = creatorName;
      sheet.getCell(signNameRow, startEndCol).font = { name: 'Times New Roman', size: 11, bold: true };
      sheet.getCell(signNameRow, startEndCol).alignment = { horizontal: 'center' };

      const buffer = await workbook.xlsx.writeBuffer();
      const downloadFilename = `Bao_Cao_Tong_Hop_12_Don_Vi_${year}.xlsx`;
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        },
      });
    }

    // ==========================================
    // 2. CASE: TIMELINE (12-MONTH) REPORT
    // ==========================================
    const isUsed = reportType === 'used_timeline';
    const sheetName = isUsed ? `Thu Hồi ĐH Cũ ${year}` : `Tiến Độ Xuất ${year}`;
    const totalCols = 17;

    const sheet = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }],
      pageSetup: {
        orientation: 'landscape',
        paperSize: 9, // A4
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    // Column Widths
    sheet.getColumn(1).width = 24; // Tên đơn vị
    for (let c = 2; c <= 13; c++) {
      sheet.getColumn(c).width = 7.5; // T1 -> T12
    }
    sheet.getColumn(14).width = 14; // Tổng xuất / Tổng chuyển về
    sheet.getColumn(15).width = 15; // Kế hoạch tháng
    sheet.getColumn(16).width = 16; // Kế hoạch năm
    sheet.getColumn(17).width = 15; // Chưa Thay / Chưa Chuyển

    // 1. Company Header
    sheet.getCell('A1').value = 'Công ty cổ phần cấp nước Sơn La';
    sheet.getCell('A1').font = { name: 'Times New Roman', size: 11 };
    sheet.getCell('A2').value = 'XƯỞNG ĐỒNG HỒ NƯỚC';
    sheet.getCell('A2').font = { name: 'Times New Roman', size: 11, bold: true };

    sheet.getCell('Q1').value = `Ngày xuất: ${todayStr}`;
    sheet.getCell('Q1').font = { name: 'Times New Roman', size: 10, italic: true };
    sheet.getCell('Q1').alignment = { horizontal: 'right' };

    // 2. Title
    sheet.mergeCells(4, 1, 4, totalCols);
    const titleCell = sheet.getCell(4, 1);
    titleCell.value = title || (isUsed ? `BẢNG TIẾN ĐỘ THU HỒI ĐỒNG HỒ CŨ 12 THÁNG NĂM ${year}` : `BẢNG TIẾN ĐỘ XUẤT ĐỒNG HỒ 12 THÁNG NĂM ${year}`);
    titleCell.font = { name: 'Times New Roman', size: 15, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(4).height = 26;

    // Subtitle
    sheet.mergeCells(5, 1, 5, totalCols);
    const subCell = sheet.getCell(5, 1);
    subCell.value = subtitle || `Loại đồng hồ: ${productName || 'Tất cả loại đồng hồ'}`;
    subCell.font = { name: 'Times New Roman', size: 11, italic: true };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(5).height = 18;

    // 3. Table Header (Row 7)
    const headerRow = sheet.getRow(7);
    headerRow.height = 28;

    const headers = [
      'TÊN ĐƠN VỊ',
      'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
      isUsed ? 'Tổng chuyển về' : 'Tổng xuất',
      isUsed ? 'KH nhận tháng' : 'KH xuất tháng',
      'Kế hoạch năm',
      isUsed ? 'Chưa Chuyển' : 'Chưa Thay',
    ];

    headers.forEach((h, idx) => {
      const colNum = idx + 1;
      const cell = sheet.getCell(7, colNum);
      cell.value = h;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF1E293B' } };
      
      // Header colors
      if (colNum === 16) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF065F46' } };
      } else if (colNum === 17) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF991B1B' } };
      } else if (colNum === 14) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isUsed ? 'FFFEF3C7' : 'FFE0E7FF' } };
        cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: isUsed ? 'FF92400E' : 'FF3730A3' } };
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      }

      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'medium', color: { argb: 'FF475569' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } },
      };
    });

    // 4. Data Rows
    let currentRow = 8;
    rows.forEach((r) => {
      const row = sheet.getRow(currentRow);
      row.height = 20;

      // Col 1: Unit Name
      const c1 = sheet.getCell(currentRow, 1);
      c1.value = r.unitName;
      c1.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      c1.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

      // Col 2-13: Months T1 -> T12
      for (let m = 0; m < 12; m++) {
        const val = r.months?.[m] || 0;
        const cell = sheet.getCell(currentRow, m + 2);
        cell.value = val > 0 ? val : '-';
        cell.font = { name: 'Times New Roman', size: 10, color: val > 0 ? { argb: 'FF0F172A' } : { argb: 'FF94A3B8' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (val > 0) cell.numFmt = '#,##0';
      }

      // Col 14: Total
      const cTotal = sheet.getCell(currentRow, 14);
      cTotal.value = r.total > 0 ? r.total : '-';
      cTotal.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF1E293B' } };
      cTotal.alignment = { horizontal: 'right', vertical: 'middle' };
      if (r.total > 0) cTotal.numFmt = '#,##0';
      cTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

      // Col 15: Plan Month
      const cPlanMonth = sheet.getCell(currentRow, 15);
      cPlanMonth.value = r.planMonth > 0 ? r.planMonth : '-';
      cPlanMonth.font = { name: 'Times New Roman', size: 10, color: { argb: 'FF334155' } };
      cPlanMonth.alignment = { horizontal: 'right', vertical: 'middle' };
      if (r.planMonth > 0) cPlanMonth.numFmt = '#,##0';

      // Col 16: Plan Year
      const cPlanYear = sheet.getCell(currentRow, 16);
      cPlanYear.value = r.planYear > 0 ? r.planYear : '-';
      cPlanYear.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF047857' } };
      cPlanYear.alignment = { horizontal: 'right', vertical: 'middle' };
      if (r.planYear > 0) cPlanYear.numFmt = '#,##0';
      cPlanYear.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };

      // Col 17: Remaining
      const cRem = sheet.getCell(currentRow, 17);
      cRem.value = r.remaining > 0 ? r.remaining : 0;
      cRem.font = { name: 'Times New Roman', size: 10, bold: true, color: r.remaining > 0 ? { argb: 'FFDC2626' } : { argb: 'FF16A34A' } };
      cRem.alignment = { horizontal: 'right', vertical: 'middle' };
      cRem.numFmt = '#,##0';
      cRem.fill = { type: 'pattern', pattern: 'solid', fgColor: r.remaining > 0 ? { argb: 'FFFEF2F2' } : { argb: 'FFF0FDF4' } };

      // Borders
      for (let c = 1; c <= totalCols; c++) {
        const cell = sheet.getCell(currentRow, c);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      }

      currentRow++;
    });

    // 5. Total Row
    const totalRowIndex = currentRow;
    const totalRow = sheet.getRow(totalRowIndex);
    totalRow.height = 24;

    const cTotTitle = sheet.getCell(totalRowIndex, 1);
    cTotTitle.value = 'TỔNG CỘNG';
    cTotTitle.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    cTotTitle.alignment = { horizontal: 'center', vertical: 'middle' };

    // Total for months T1 -> T12
    for (let m = 0; m < 12; m++) {
      const val = totals?.months?.[m] || 0;
      const cell = sheet.getCell(totalRowIndex, m + 2);
      cell.value = val > 0 ? val : '-';
      cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (val > 0) cell.numFmt = '#,##0';
    }

    // Total Total
    const cTotTotal = sheet.getCell(totalRowIndex, 14);
    cTotTotal.value = totals?.total || 0;
    cTotTotal.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF1E293B' } };
    cTotTotal.alignment = { horizontal: 'right', vertical: 'middle' };
    cTotTotal.numFmt = '#,##0';

    // Total Plan Month
    const cTotPlanMonth = sheet.getCell(totalRowIndex, 15);
    cTotPlanMonth.value = totals?.planMonth || 0;
    cTotPlanMonth.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF334155' } };
    cTotPlanMonth.alignment = { horizontal: 'right', vertical: 'middle' };
    cTotPlanMonth.numFmt = '#,##0';

    // Total Plan Year
    const cTotPlanYear = sheet.getCell(totalRowIndex, 16);
    cTotPlanYear.value = totals?.planYear || 0;
    cTotPlanYear.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF047857' } };
    cTotPlanYear.alignment = { horizontal: 'right', vertical: 'middle' };
    cTotPlanYear.numFmt = '#,##0';

    // Total Remaining
    const cTotRem = sheet.getCell(totalRowIndex, 17);
    cTotRem.value = totals?.remaining || 0;
    cTotRem.font = { name: 'Times New Roman', size: 11, bold: true, color: (totals?.remaining || 0) > 0 ? { argb: 'FFDC2626' } : { argb: 'FF16A34A' } };
    cTotRem.alignment = { horizontal: 'right', vertical: 'middle' };
    cTotRem.numFmt = '#,##0';

    for (let c = 1; c <= totalCols; c++) {
      const cell = sheet.getCell(totalRowIndex, c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF475569' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'double', color: { argb: 'FF1E293B' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } },
      };
    }

    // 6. Signatures Section (3 columns: Trưởng phòng, Phụ trách xưởng, Người lập biểu)
    const signTitleRow = totalRowIndex + 3;
    const signSubRow = signTitleRow + 1;
    const signNameRow = signTitleRow + 5;

    // Col 1: Trưởng phòng (Cols 2-4)
    sheet.mergeCells(signTitleRow, 2, signTitleRow, 4);
    sheet.getCell(signTitleRow, 2).value = 'TRƯỞNG PHÒNG';
    sheet.getCell(signTitleRow, 2).font = { name: 'Times New Roman', size: 11, bold: true };
    sheet.getCell(signTitleRow, 2).alignment = { horizontal: 'center' };

    sheet.mergeCells(signSubRow, 2, signSubRow, 4);
    sheet.getCell(signSubRow, 2).value = '(Ký, ghi rõ họ tên)';
    sheet.getCell(signSubRow, 2).font = { name: 'Times New Roman', size: 10, italic: true };
    sheet.getCell(signSubRow, 2).alignment = { horizontal: 'center' };

    sheet.mergeCells(signNameRow, 2, signNameRow, 4);
    sheet.getCell(signNameRow, 2).value = deptManagerName;
    sheet.getCell(signNameRow, 2).font = { name: 'Times New Roman', size: 11, bold: true };
    sheet.getCell(signNameRow, 2).alignment = { horizontal: 'center' };

    // Col 2: Phụ trách xưởng (Cols 8-10)
    sheet.mergeCells(signTitleRow, 8, signTitleRow, 10);
    sheet.getCell(signTitleRow, 8).value = 'PHỤ TRÁCH XƯỞNG';
    sheet.getCell(signTitleRow, 8).font = { name: 'Times New Roman', size: 11, bold: true };
    sheet.getCell(signTitleRow, 8).alignment = { horizontal: 'center' };

    sheet.mergeCells(signSubRow, 8, signSubRow, 10);
    sheet.getCell(signSubRow, 8).value = '(Ký, ghi rõ họ tên)';
    sheet.getCell(signSubRow, 8).font = { name: 'Times New Roman', size: 10, italic: true };
    sheet.getCell(signSubRow, 8).alignment = { horizontal: 'center' };

    sheet.mergeCells(signNameRow, 8, signNameRow, 10);
    sheet.getCell(signNameRow, 8).value = workshopManagerName;
    sheet.getCell(signNameRow, 8).font = { name: 'Times New Roman', size: 11, bold: true };
    sheet.getCell(signNameRow, 8).alignment = { horizontal: 'center' };

    // Col 3: Người lập biểu (Cols 14-17)
    const signDateRow = signTitleRow - 1;
    sheet.mergeCells(signDateRow, 14, signDateRow, 17);
    sheet.getCell(signDateRow, 14).value = `Sơn La, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${year}`;
    sheet.getCell(signDateRow, 14).font = { name: 'Times New Roman', size: 10, italic: true };
    sheet.getCell(signDateRow, 14).alignment = { horizontal: 'center' };

    sheet.mergeCells(signTitleRow, 14, signTitleRow, 17);
    sheet.getCell(signTitleRow, 14).value = 'NGƯỜI LẬP BIỂU';
    sheet.getCell(signTitleRow, 14).font = { name: 'Times New Roman', size: 11, bold: true };
    sheet.getCell(signTitleRow, 14).alignment = { horizontal: 'center' };

    sheet.mergeCells(signSubRow, 14, signSubRow, 17);
    sheet.getCell(signSubRow, 14).value = '(Ký, ghi rõ họ tên)';
    sheet.getCell(signSubRow, 14).font = { name: 'Times New Roman', size: 10, italic: true };
    sheet.getCell(signSubRow, 14).alignment = { horizontal: 'center' };

    sheet.mergeCells(signNameRow, 14, signNameRow, 17);
    sheet.getCell(signNameRow, 14).value = creatorName;
    sheet.getCell(signNameRow, 14).font = { name: 'Times New Roman', size: 11, bold: true };
    sheet.getCell(signNameRow, 14).alignment = { horizontal: 'center' };

    const buffer = await workbook.xlsx.writeBuffer();
    const downloadFilename = isUsed
      ? `Tien_Do_Thu_Hoi_DH_Cu_${year}.xlsx`
      : `Tien_Do_Xuat_Dong_Ho_12_Thang_${year}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating Excel report:', error);
    return NextResponse.json({ error: error.message || 'Lỗi tạo file Excel' }, { status: 500 });
  }
}
