'use client';

import React, { useState } from 'react';
import { Printer, X, Download, FileText, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { numberToVietnameseWords } from '@/lib/numberToWords';
import ExcelJS from 'exceljs';

export interface VoucherPrintItem {
  stt?: number;
  code?: string;
  name: string;
  unit: string;
  docQuantity?: number;
  actualQuantity: number;
  unitPrice?: number;
  amount?: number;
  statusText?: string;
  notes?: string;
}

export interface VoucherPrintData {
  type: 'export' | 'import';
  code: string;
  voucherDate: string | Date;
  creatorName?: string;
  delivererName?: string; // Người giao
  receiverName?: string;  // Người nhận
  technicianName?: string; // Phụ trách kỹ thuật
  workshopManagerName?: string; // Xưởng đồng hồ
  customerDeptName?: string; // Phòng quản lý khách hàng / Đại diện người giao hàng
  destinationOrSupplier: string; // Nơi nhận / Nguồn cấp
  warehouseName?: string; // Tên kho (Kho VP / Xưởng SOWASUCO)
  warehouseAddress?: string;
  reason: string; // Lý do xuất / nhập
  items: VoucherPrintItem[];
  notes?: string;
  totalAmount?: number;
  contractNumber?: string;
  batchName?: string;
  voucherCategory?: 'used_meter_import' | 'contract_import' | 'repair_material_export' | 'standard' | string;
  customTitle?: string;
}

export function PrintVoucherModal({
  data,
  onClose,
}: {
  data: VoucherPrintData;
  onClose: () => void;
}) {
  const isExport = data.type === 'export';
  const isUsedMeterImport = data.voucherCategory === 'used_meter_import';
  const isContractImport = data.voucherCategory === 'contract_import' || (!isExport && !isUsedMeterImport);
  const isRepairMaterialExport = data.voucherCategory === 'repair_material_export';
  const isUnitDistributionExport = data.voucherCategory === 'unit_distribution_export';

  // Signer names from voucher data
  const delivererName = data.delivererName || (isUnitDistributionExport ? data.destinationOrSupplier : (data.customerDeptName || 'Đại diện bên giao hàng'));
  const creatorName = data.creatorName || (isRepairMaterialExport ? 'Lương Phương Thảo' : 'Nguyễn Văn Tiến');
  const receiverName = data.receiverName || (isRepairMaterialExport ? 'Nguyễn Văn Tiến' : (isExport ? (data.destinationOrSupplier || 'Đại diện đơn vị') : 'Nguyễn Văn Tiến'));
  const workshopManagerName = data.workshopManagerName || data.technicianName || 'Bùi Đức Duy';
  const technicianName = data.technicianName || 'Bùi Đức Duy';

  const voucherTitle = data.customTitle || (isUnitDistributionExport ? 'PHIẾU XIN LĨNH' : isRepairMaterialExport ? 'PHIẾU XIN LĨNH VẬT TƯ' : (isExport ? 'PHIẾU XUẤT KHO' : 'PHIẾU NHẬP KHO'));

  const vDate = new Date(data.voucherDate);
  const day = String(vDate.getDate()).padStart(2, '0');
  const month = String(vDate.getMonth() + 1).padStart(2, '0');
  const year = vDate.getFullYear();

  const totalQuantity = data.items.reduce((sum, item) => sum + (item.actualQuantity || 0), 0);
  const totalAmount = data.totalAmount || data.items.reduce((sum, item) => sum + (item.amount || (item.actualQuantity * (item.unitPrice || 0))), 0);
  const amountInWords = numberToVietnameseWords(totalAmount);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SOWASUCO WM System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(data.code || 'Phieu', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      views: [{ showGridLines: true }],
    });

    // Cấu hình độ rộng các cột
    sheet.columns = [
      { key: 'A', width: 6 },   // STT
      { key: 'B', width: 34 },  // Tên, quy cách
      { key: 'C', width: 14 },  // Mã số
      { key: 'D', width: 10 },  // ĐVT
      { key: 'E', width: 14 },  // SL Yêu cầu
      { key: 'F', width: 14 },  // SL Thực xuất / nhập
      { key: 'G', width: 22 },  // Ghi chú
    ];

    // Dòng 1: Đơn vị chủ quản
    const r1 = sheet.addRow(['CÔNG TY CỔ PHẦN CẤP NƯỚC SƠN LA', '', '', '', '', 'Mẫu số: ' + (isExport ? '02 - VT' : '01 - VT')]);
    r1.getCell(1).font = { name: 'Times New Roman', size: 11, bold: true };
    r1.getCell(6).font = { name: 'Times New Roman', size: 10, bold: true };
    r1.getCell(6).alignment = { horizontal: 'center' };
    sheet.mergeCells('A1:C1');
    sheet.mergeCells('F1:G1');

    // Dòng 2: Bộ phận & Thông tư quy định
    const r2 = sheet.addRow(['Đơn vị: Xưởng đồng hồ', '', '', '', '', '(Ban hành theo TT số 200/2014/TT-BTC']);
    r2.getCell(1).font = { name: 'Times New Roman', size: 10, bold: true };
    r2.getCell(6).font = { name: 'Times New Roman', size: 9, italic: true };
    r2.getCell(6).alignment = { horizontal: 'center' };
    sheet.mergeCells('A2:C2');
    sheet.mergeCells('F2:G2');

    // Dòng 3: Địa chỉ & Thông tư quy định
    const r3 = sheet.addRow(['Địa chỉ: Ngõ 43, Tổ 6 Chiềng Lề - Phường Tô Hiệu - Sơn La', '', '', '', '', '& TT 133/2016/TT-BTC của BTC)']);
    r3.getCell(1).font = { name: 'Times New Roman', size: 9, italic: true };
    r3.getCell(6).font = { name: 'Times New Roman', size: 9, italic: true };
    r3.getCell(6).alignment = { horizontal: 'center' };
    sheet.mergeCells('A3:D3');
    sheet.mergeCells('F3:G3');

    // Dòng 4: Nợ / Có
    const r4 = sheet.addRow(['', '', '', '', '', 'Nợ: ......... Có: .........']);
    r4.getCell(6).font = { name: 'Times New Roman', size: 9, italic: true };
    r4.getCell(6).alignment = { horizontal: 'center' };
    sheet.mergeCells('F4:G4');

    sheet.addRow([]); // Dòng trống 5

    // Dòng 6: TIÊU ĐỀ PHIẾU
    const r5 = sheet.addRow([voucherTitle.toUpperCase()]);
    r5.getCell(1).font = { name: 'Times New Roman', size: 16, bold: true };
    r5.getCell(1).alignment = { horizontal: 'center' };
    sheet.mergeCells(`A${r5.number}:G${r5.number}`);

    // Dòng 7: Ngày tháng năm
    const r6 = sheet.addRow([`Ngày ${day} tháng ${month} năm ${year}`]);
    r6.getCell(1).font = { name: 'Times New Roman', size: 11, italic: true };
    r6.getCell(1).alignment = { horizontal: 'center' };
    sheet.mergeCells(`A${r6.number}:G${r6.number}`);

    // Dòng 8: Số phiếu
    const r7 = sheet.addRow([`Số: ${data.code}`]);
    r7.getCell(1).font = { name: 'Times New Roman', size: 11, bold: true };
    r7.getCell(1).alignment = { horizontal: 'center' };
    sheet.mergeCells(`A${r7.number}:G${r7.number}`);

    sheet.addRow([]); // Dòng trống trước thông tin chung

    // Dòng thông tin chung
    const addInfoRow = (label: string, value: string) => {
      const row = sheet.addRow([label, value]);
      row.getCell(1).font = { name: 'Times New Roman', size: 11, bold: false };
      row.getCell(2).font = { name: 'Times New Roman', size: 11, bold: true };
      sheet.mergeCells(`B${row.number}:G${row.number}`);
      return row;
    };

    const personLabel = isUnitDistributionExport ? '- Họ và tên người giao hàng:' : isExport ? '- Họ và tên người nhận hàng:' : '- Họ và tên người giao hàng:';
    const personVal = isUnitDistributionExport ? (delivererName || data.destinationOrSupplier) : isExport ? (data.receiverName || data.destinationOrSupplier) : (delivererName || data.destinationOrSupplier);
    addInfoRow(personLabel, personVal);

    if (!isExport && data.receiverName) {
      addInfoRow('- Họ và tên người nhận hàng:', creatorName || data.receiverName);
    }

    const unitLabel = isExport ? '- Địa chỉ / Đơn vị tiếp nhận:' : '- Đơn vị cung cấp / Nguồn nhập:';
    let unitVal = data.destinationOrSupplier;
    if (data.contractNumber) {
      unitVal += ` (Theo HĐ: ${data.contractNumber}${data.batchName ? ` - ${data.batchName}` : ''})`;
    }
    addInfoRow(unitLabel, unitVal);

    const defaultReason = isExport ? 'Xuất cấp đồng hồ phục vụ mạng lưới cấp nước sinh hoạt' : 'Nhập kho vật tư linh kiện & đồng hồ mới';
    addInfoRow(`- Lý do ${isExport ? 'xuất kho:' : 'nhập kho:'}`, data.reason || defaultReason);

    addInfoRow(`- ${isExport ? 'Xuất' : 'Nhập'} tại kho (ngăn lô):`, data.warehouseName || 'Xưởng đồng hồ (SOWASUCO)');

    sheet.addRow([]); // Dòng trống trước bảng

    // Header bảng 2 tầng
    const tableHeaderStart = sheet.lastRow!.number + 1;
    const th1 = sheet.addRow(['STT', 'Tên, nhãn hiệu, quy cách, phẩm chất vật tư, sản phẩm', 'Mã số', 'ĐVT', 'Số lượng', '', 'Ghi chú / Tình trạng']);
    const th2 = sheet.addRow(['', '', '', '', 'Yêu cầu', `Thực ${isExport ? 'xuất' : 'nhập'}`, '']);
    const th3 = sheet.addRow(['A', 'B', 'C', 'D', '1', '2', '-']);

    // Merge các ô header bảng
    sheet.mergeCells(`A${tableHeaderStart}:A${tableHeaderStart + 1}`);
    sheet.mergeCells(`B${tableHeaderStart}:B${tableHeaderStart + 1}`);
    sheet.mergeCells(`C${tableHeaderStart}:C${tableHeaderStart + 1}`);
    sheet.mergeCells(`D${tableHeaderStart}:D${tableHeaderStart + 1}`);
    sheet.mergeCells(`E${tableHeaderStart}:F${tableHeaderStart}`);
    sheet.mergeCells(`G${tableHeaderStart}:G${tableHeaderStart + 1}`);

    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };

    for (let r = tableHeaderStart; r <= tableHeaderStart + 2; r++) {
      const row = sheet.getRow(r);
      row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      row.font = { name: 'Times New Roman', size: 10, bold: r < tableHeaderStart + 2 };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: r < tableHeaderStart + 2 ? 'FFF1F5F9' : 'FFF8FAFC' } };
      for (let c = 1; c <= 7; c++) {
        row.getCell(c).border = borderStyle;
      }
    }

    // Các dòng dữ liệu
    data.items.forEach((item, index) => {
      const actual = item.actualQuantity || 0;
      const docQty = item.docQuantity !== undefined ? item.docQuantity : actual;
      const nameWithStatus = item.name + (item.statusText ? ` (${item.statusText})` : '');
      const dRow = sheet.addRow([
        index + 1,
        nameWithStatus,
        item.code || '-',
        item.unit || 'Cái',
        docQty,
        actual,
        item.notes
          ? item.statusText
            ? `${item.notes} (${item.statusText})`
            : item.notes
          : item.statusText || '',
      ]);

      dRow.font = { name: 'Times New Roman', size: 10 };
      dRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      dRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
      dRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      dRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
      dRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
      dRow.getCell(5).numFmt = '#,##0';
      dRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
      dRow.getCell(6).numFmt = '#,##0';
      dRow.getCell(6).font = { name: 'Times New Roman', size: 10, bold: true };
      dRow.getCell(7).alignment = { horizontal: 'left', vertical: 'middle' };

      for (let c = 1; c <= 7; c++) {
        dRow.getCell(c).border = borderStyle;
      }
    });

    // Dòng Cộng Tổng
    const totalRow = sheet.addRow(['Cộng Tổng', '', '', '', totalQuantity, totalQuantity, '']);
    sheet.mergeCells(`A${totalRow.number}:D${totalRow.number}`);
    totalRow.font = { name: 'Times New Roman', size: 10, bold: true };
    totalRow.alignment = { vertical: 'middle' };
    totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    totalRow.getCell(5).numFmt = '#,##0';
    totalRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
    totalRow.getCell(6).numFmt = '#,##0';
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    for (let c = 1; c <= 7; c++) {
      totalRow.getCell(c).border = borderStyle;
    }

    // Dòng Viết Bằng Chữ chuẩn quy định kế toán
    if (totalAmount > 0) {
      const amtRow = sheet.addRow([`- Tổng số tiền (viết bằng chữ): ${amountInWords ? (amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1)) : 'Không đồng'}.`]);
      amtRow.getCell(1).font = { name: 'Times New Roman', size: 10, italic: true };
      sheet.mergeCells(`A${amtRow.number}:G${amtRow.number}`);
    }

    const qtyInWords = numberToVietnameseWords(totalQuantity);
    const qtyRow = sheet.addRow([`- Tổng số lượng (viết bằng chữ): ${qtyInWords ? (qtyInWords.charAt(0).toUpperCase() + qtyInWords.slice(1)) : 'Không'} cái/bộ.`]);
    qtyRow.getCell(1).font = { name: 'Times New Roman', size: 10, italic: true };
    sheet.mergeCells(`A${qtyRow.number}:G${qtyRow.number}`);

    const docRow = sheet.addRow(['- Số chứng từ gốc kèm theo: ....................................................................................................................................']);
    docRow.getCell(1).font = { name: 'Times New Roman', size: 10 };
    sheet.mergeCells(`A${docRow.number}:G${docRow.number}`);

    sheet.addRow([]); // Dòng trống

    // Khu vực chữ ký
    const sigDateRow = sheet.addRow(['', '', '', '', `Sơn La, ngày ${day} tháng ${month} năm ${year}`]);
    sigDateRow.getCell(5).font = { name: 'Times New Roman', size: 10, italic: true };
    sigDateRow.getCell(5).alignment = { horizontal: 'center' };
    sheet.mergeCells(`E${sigDateRow.number}:G${sigDateRow.number}`);

    let titleCells: { col: number; span: number; title: string; sub: string; name: string }[] = [];

    if (isContractImport) {
      titleCells = [
        { col: 1, span: 2, title: 'Người lập phiếu', sub: '(Ký, họ tên)', name: creatorName || 'Nguyễn Văn Tiến' },
        { col: 3, span: 2, title: 'Đại diện người giao hàng', sub: '(Ký, họ tên)', name: delivererName || 'Đại diện bên giao hàng' },
        { col: 5, span: 3, title: 'Xưởng đồng hồ', sub: '(Ký, họ tên)', name: workshopManagerName || 'Bùi Đức Duy' },
      ];
    } else if (isUsedMeterImport) {
      titleCells = [
        { col: 1, span: 2, title: 'Người lập', sub: '(Ký, họ tên)', name: data.receiverName || data.creatorName || 'Nguyễn Văn Tiến' },
        { col: 3, span: 2, title: 'Người giao', sub: '(Ký, họ tên)', name: data.delivererName || 'Bên giao hàng' },
        { col: 5, span: 3, title: 'Phụ trách kỹ thuật', sub: '(Ký, họ tên)', name: data.technicianName || 'Bùi Đức Duy' },
      ];
    } else if (isRepairMaterialExport) {
      titleCells = [
        { col: 1, span: 2, title: 'Người lập phiếu', sub: '(Ký, họ tên)', name: creatorName || data.creatorName || 'Lương Phương Thảo' },
        { col: 3, span: 2, title: 'Người nhận hàng', sub: '(Ký, họ tên)', name: receiverName || data.receiverName || 'Nguyễn Văn Tiến' },
        { col: 5, span: 3, title: 'Xưởng đồng hồ', sub: '(Ký, họ tên)', name: workshopManagerName || data.workshopManagerName || 'Bùi Đức Duy' },
      ];
    } else if (isUnitDistributionExport) {
      titleCells = [
        { col: 1, span: 2, title: 'Người lập phiếu', sub: '(Ký, họ tên)', name: creatorName || data.creatorName || 'Nguyễn Văn Tiến' },
        { col: 3, span: 2, title: 'Người giao', sub: '(Ký, họ tên)', name: delivererName || data.delivererName || data.destinationOrSupplier || 'Đại diện đơn vị' },
        { col: 5, span: 3, title: 'Phụ trách kỹ thuật', sub: '(Ký, họ tên)', name: technicianName || data.technicianName || 'Bùi Đức Duy' },
      ];
    } else {
      titleCells = [
        { col: 1, span: 1, title: 'Người lập phiếu', sub: '(Ký, họ tên)', name: creatorName || data.creatorName || 'Phạm Phương Đông' },
        { col: 2, span: 1, title: isExport ? 'Người nhận' : 'Người giao', sub: '(Ký, họ tên)', name: isExport ? (receiverName || data.receiverName || 'Đại diện đơn vị') : (delivererName || data.delivererName || 'Bên giao hàng') },
        { col: 3, span: 2, title: 'Thủ kho', sub: '(Ký, họ tên)', name: 'Nguyễn Văn Kho' },
        { col: 5, span: 1, title: 'Kế toán trưởng', sub: '(Ký, họ tên)', name: 'Phụ trách kế toán' },
        { col: 6, span: 2, title: 'Thủ trưởng đơn vị', sub: '(Ký, đóng dấu)', name: 'Ban Giám Đốc' },
      ];
    }

    const sigTitleRow = sheet.addRow(new Array(7).fill(''));
    const sigSubRow = sheet.addRow(new Array(7).fill(''));
    sheet.addRow([]); // Khoảng trống ký
    sheet.addRow([]);
    sheet.addRow([]);
    const sigNameRow = sheet.addRow(new Array(7).fill(''));

    titleCells.forEach(tc => {
      const endCol = tc.col + tc.span - 1;
      const getColLetter = (c: number) => String.fromCharCode(64 + c);

      sigTitleRow.getCell(tc.col).value = tc.title;
      sigTitleRow.getCell(tc.col).font = { name: 'Times New Roman', size: 10, bold: true };
      sigTitleRow.getCell(tc.col).alignment = { horizontal: 'center' };

      sigSubRow.getCell(tc.col).value = tc.sub;
      sigSubRow.getCell(tc.col).font = { name: 'Times New Roman', size: 9, italic: true };
      sigSubRow.getCell(tc.col).alignment = { horizontal: 'center' };

      sigNameRow.getCell(tc.col).value = tc.name;
      sigNameRow.getCell(tc.col).font = { name: 'Times New Roman', size: 10, bold: true };
      sigNameRow.getCell(tc.col).alignment = { horizontal: 'center' };

      if (tc.span > 1) {
        sheet.mergeCells(`${getColLetter(tc.col)}${sigTitleRow.number}:${getColLetter(endCol)}${sigTitleRow.number}`);
        sheet.mergeCells(`${getColLetter(tc.col)}${sigSubRow.number}:${getColLetter(endCol)}${sigSubRow.number}`);
        sheet.mergeCells(`${getColLetter(tc.col)}${sigNameRow.number}:${getColLetter(endCol)}${sigNameRow.number}`);
      }
    });

    // Xuất file excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const filePrefix = isRepairMaterialExport ? 'Phieu_Xin_Linh_Vat_Tu' : isUnitDistributionExport ? 'Phieu_Xin_Linh' : (data.type === 'export' ? 'Phieu_Xuat_Kho' : 'Phieu_Nhap_Kho');
    link.download = `${filePrefix}_${data.code}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 25mm; /* Chuẩn Nghị định 30/2020: Lề trái 25mm đóng gáy lưu hồ sơ */
          }

          html, body {
            background: #fff !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: "Times New Roman", Times, Georgia, serif !important;
          }

          body * {
            visibility: hidden !important;
          }

          #printable-voucher-sheet,
          #printable-voucher-sheet * {
            visibility: visible !important;
            color: #000 !important;
          }

          /* Đảm bảo khung ngoài của modal không chiếm không gian hay background */
          .fixed {
            position: static !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            overflow: visible !important;
          }

          .print\\:hidden, button, [role="button"] {
            display: none !important;
          }

          #printable-voucher-sheet {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #fff !important;
            font-family: "Times New Roman", Times, Georgia, serif !important;
            font-size: 13px !important;
            line-height: 1.5 !important;
            color: #000 !important;
          }

          /* Bảng chi tiết in sắc nét đúng chuẩn kế toán */
          #printable-voucher-sheet table {
            width: 100% !important;
            border-collapse: collapse !important;
            border: 1.5px solid #000 !important;
            margin-top: 8px !important;
            margin-bottom: 8px !important;
            page-break-inside: auto !important;
          }

          #printable-voucher-sheet thead {
            display: table-header-group !important;
          }

          #printable-voucher-sheet tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          #printable-voucher-sheet th,
          #printable-voucher-sheet td {
            border: 1px solid #000 !important;
            color: #000 !important;
            padding: 5px 6px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #printable-voucher-sheet thead tr {
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #printable-voucher-sheet tr.font-bold,
          #printable-voucher-sheet tr:last-child {
            background-color: #f8fafc !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .voucher-signature-grid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-top: 16px !important;
          }
        }
      `}} />
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:w-full print:rounded-none">
        {/* Top bar controls (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base font-sans">
              Xem Trước Phiếu In: {voucherTitle} [{data.code}]
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all cursor-pointer font-sans"
            >
              <Printer className="w-4 h-4" />
              In / Xuất PDF (A4)
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all cursor-pointer font-sans"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Xuất Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Đóng xem trước"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas (Chuẩn biểu mẫu BTC Việt Nam A4) */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-white print:p-0 print:overflow-visible text-black font-serif">
          <div
            id="printable-voucher-sheet"
            className="max-w-[780px] mx-auto space-y-3.5 font-serif text-[13px] leading-relaxed text-black border border-slate-200 p-8 rounded-lg shadow-2xs print:border-none print:p-0 print:shadow-none"
          >
            
            {/* Header: Doanh nghiệp & Mẫu biểu chuẩn BTC */}
            <div className="flex justify-between items-start">
              <div className="text-left space-y-0.5">
                <p className="font-bold uppercase text-[12px] tracking-wide text-black">
                  CÔNG TY CỔ PHẦN CẤP NƯỚC SƠN LA
                </p>
                <p className="font-bold text-[11px] uppercase text-black">
                  XƯỞNG ĐỒNG HỒ
                </p>
                <p className="text-[10px] text-slate-700 italic">
                  Địa chỉ: Ngõ 43, Tổ 6 Chiềng Lề - P. Tô Hiệu - Tỉnh Sơn La
                </p>
              </div>

              <div className="text-center space-y-0.5 min-w-[210px]">
                <p className="font-bold text-[12px] uppercase text-black">
                  Mẫu số: {isExport ? '02 - VT' : '01 - VT'}
                </p>
                <p className="text-[9.5px] text-slate-600 max-w-[210px] leading-tight italic">
                  (Ban hành theo Thông tư số 200/2014/TT-BTC & TT 133/2016/TT-BTC của Bộ Tài chính)
                </p>
                <div className="pt-0.5 text-[11px] text-slate-800 flex justify-center gap-5">
                  <span className="font-serif italic">Nợ: ............</span>
                  <span className="font-serif italic">Có: ............</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center py-1 space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-black font-serif">
                {voucherTitle}
              </h1>
              <p className="italic text-[12px] text-slate-700">
                Ngày {day} tháng {month} năm {year}
              </p>
              <p className="font-bold text-xs text-black">
                Số: <span className="font-serif font-bold text-black">{data.code}</span>
              </p>
            </div>

            {/* Thông tin chung */}
            <div className="space-y-1 pt-1 text-[13px] leading-relaxed text-black">
              <div className="flex items-baseline">
                <span className="w-52 shrink-0 font-medium text-black">
                  {isUnitDistributionExport ? '- Họ và tên người giao hàng:' : isExport ? '- Họ và tên người nhận hàng:' : '- Họ và tên người giao hàng:'}
                </span>
                <span className="font-bold text-black border-b border-dotted border-black/60 flex-1 pl-1">
                  {isUnitDistributionExport ? (delivererName || data.destinationOrSupplier) : isExport ? (receiverName || data.destinationOrSupplier) : (delivererName || data.destinationOrSupplier)}
                </span>
              </div>

              {!isExport && (
                <div className="flex items-baseline">
                  <span className="w-52 shrink-0 font-medium text-black">
                    - Họ và tên người nhận hàng:
                  </span>
                  <span className="font-bold text-black border-b border-dotted border-black/60 flex-1 pl-1">
                    {creatorName || receiverName || 'Nguyễn Văn Tiến'}
                  </span>
                </div>
              )}

              <div className="flex items-baseline">
                <span className="w-52 shrink-0 font-medium text-black">
                  {isExport ? '- Địa chỉ / Đơn vị tiếp nhận:' : '- Đơn vị cung cấp / Nguồn nhập:'}
                </span>
                <span className="font-semibold text-black border-b border-dotted border-black/60 flex-1 pl-1">
                  {data.destinationOrSupplier}
                  {data.contractNumber && ` (Theo HĐ: ${data.contractNumber}${data.batchName ? ` - ${data.batchName}` : ''})`}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="w-52 shrink-0 font-medium text-black">- Lý do {isExport ? 'xuất kho:' : 'nhập kho:'}</span>
                <span className="border-b border-dotted border-black/60 flex-1 pl-1 text-black">
                  {data.reason || (isExport ? 'Xuất cấp đồng hồ phục vụ mạng lưới cấp nước sinh hoạt' : 'Nhập kho vật tư linh kiện & đồng hồ mới')}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="w-52 shrink-0 font-medium text-black">
                  {isExport ? '- Xuất tại kho (ngăn lô):' : '- Nhập tại kho (ngăn lô):'}
                </span>
                <span className="border-b border-dotted border-black/60 flex-1 pl-1 font-semibold text-black">
                  {data.warehouseName || 'Xưởng đồng hồ (SOWASUCO)'}
                </span>
              </div>
            </div>

            {/* Bảng Kê Chi Tiết */}
            <div className="pt-1">
              <table className="w-full text-[12px] border-collapse border border-black text-left">
                <thead>
                  <tr className="bg-slate-100 text-center font-bold text-black border-b border-black">
                    <th rowSpan={2} className="border border-black p-1.5 w-10">STT</th>
                    <th rowSpan={2} className="border border-black p-1.5 min-w-[170px]">
                      Tên, nhãn hiệu, quy cách, phẩm chất vật tư, sản phẩm
                    </th>
                    <th rowSpan={2} className="border border-black p-1.5 w-24">Mã số</th>
                    <th rowSpan={2} className="border border-black p-1.5 w-14">ĐVT</th>
                    <th colSpan={2} className="border border-black p-1">Số lượng</th>
                    <th rowSpan={2} className="border border-black p-1.5 min-w-[120px]">Ghi chú / Tình trạng</th>
                  </tr>
                  <tr className="bg-slate-50 text-center font-semibold text-black border-b border-black text-[11px]">
                    <th className="border border-black p-1 w-20">Yêu cầu</th>
                    <th className="border border-black p-1 w-20">Thực {isExport ? 'xuất' : 'nhập'}</th>
                  </tr>
                  <tr className="text-center font-serif text-[10px] text-slate-700 bg-slate-50/50 border-b border-black">
                    <td className="border border-black py-0.5">A</td>
                    <td className="border border-black py-0.5">B</td>
                    <td className="border border-black py-0.5">C</td>
                    <td className="border border-black py-0.5">D</td>
                    <td className="border border-black py-0.5">1</td>
                    <td className="border border-black py-0.5">2</td>
                    <td className="border border-black py-0.5">-</td>
                  </tr>
                </thead>

                <tbody className="divide-y divide-black">
                  {data.items.map((it, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="border border-black p-1.5 text-center font-mono">
                          {idx + 1}
                        </td>
                        <td className="border border-black p-1.5 font-medium">
                          {it.name}
                          {it.statusText && (
                            <span className="italic text-[11px] text-slate-700 ml-1">
                              ({it.statusText})
                            </span>
                          )}
                        </td>
                        <td className="border border-black p-1.5 text-center font-mono text-[11px]">
                          {it.code || '-'}
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          {it.unit || 'Cái'}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono">
                          {it.docQuantity !== undefined ? it.docQuantity.toLocaleString('vi-VN') : (it.actualQuantity || 0).toLocaleString('vi-VN')}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono font-bold">
                          {(it.actualQuantity || 0).toLocaleString('vi-VN')}
                        </td>
                        <td className="border border-black p-1.5 text-slate-800 text-[11px]">
                          {it.notes || it.statusText || '-'}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Dòng Cộng Tổng */}
                  <tr className="bg-slate-50 font-bold border-t-2 border-black text-black">
                    <td colSpan={4} className="border border-black p-2 text-center uppercase tracking-wide text-[11px]">
                      Cộng Tổng
                    </td>
                    <td className="border border-black p-2 text-right font-mono">
                      {totalQuantity.toLocaleString('vi-VN')}
                    </td>
                    <td className="border border-black p-2 text-right font-mono font-black text-[13px] text-black">
                      {totalQuantity.toLocaleString('vi-VN')}
                    </td>
                    <td className="border border-black p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Dòng Viết Bằng Chữ chuẩn quy định BTC */}
            <div className="space-y-1.5 pt-1 text-[13px] text-black">
              {totalAmount > 0 && (
                <div className="flex items-baseline">
                  <span className="font-semibold shrink-0">- Tổng số tiền (viết bằng chữ):</span>
                  <span className="font-bold italic pl-2 border-b border-dotted border-black/60 flex-1">
                    {amountInWords ? (amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1)) : 'Không đồng'}.
                  </span>
                </div>
              )}
              <div className="flex items-baseline">
                <span className="font-semibold shrink-0">- Tổng số lượng (viết bằng chữ):</span>
                <span className="font-bold italic pl-2 border-b border-dotted border-black/60 flex-1">
                  {(() => {
                    const w = numberToVietnameseWords(totalQuantity);
                    return (w ? (w.charAt(0).toUpperCase() + w.slice(1)) : 'Không') + ' cái/bộ.';
                  })()}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="shrink-0">- Số chứng từ gốc kèm theo:</span>
                <span className="border-b border-dotted border-black/60 flex-1 pl-2">
                  ....................................................................................................................................
                </span>
              </div>
            </div>

            {/* Khu vực chữ ký */}
            <div className="pt-3">
              <div className="text-right italic text-[12px] text-black mb-2">
                Sơn La, ngày {day} tháng {month} năm {year}
              </div>

              {isContractImport ? (
                /* Mẫu số: 01 - VT trong phần Nhập Kho Theo Hợp Đồng: Người lập phiếu, Đại diện người giao hàng, Xưởng đồng hồ */
                <div className="voucher-signature-grid grid grid-cols-3 gap-4 text-center text-[12px]">
                  {/* 1. Người lập phiếu */}
                  <div className="space-y-1">
                    <p className="font-bold text-black uppercase">Người lập phiếu</p>
                    <p className="italic text-[10.5px] text-slate-600">(Ký, họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <span className="font-bold text-black text-[12px]">
                        {creatorName || 'Nguyễn Văn Tiến'}
                      </span>
                    </div>
                  </div>

                  {/* 2. Đại diện người giao hàng */}
                  <div className="space-y-1">
                    <p className="font-bold text-black uppercase">Đại diện người giao hàng</p>
                    <p className="italic text-[10.5px] text-slate-600">(Ký, họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <span className="font-bold text-black text-[12px]">
                        {delivererName || 'Đại diện bên giao hàng'}
                      </span>
                    </div>
                  </div>

                  {/* 3. Xưởng đồng hồ */}
                  <div className="space-y-1">
                    <p className="font-bold text-black uppercase">Xưởng đồng hồ</p>
                    <p className="italic text-[10.5px] text-slate-600">(Ký, họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <span className="font-bold text-black text-[12px]">
                        {workshopManagerName || 'Bùi Đức Duy'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : isUsedMeterImport ? (
                /* Mẫu số: 01 - VT trong phần Nhập Kho Đồng Hồ Cũ: Người lập, Người giao, Phụ trách kỹ thuật */
                <div className="voucher-signature-grid grid grid-cols-3 gap-4 text-center text-[12px]">
                  {/* 1. Người lập */}
                  <div className="space-y-1">
                    <p className="font-bold text-black uppercase">Người lập</p>
                    <p className="italic text-[10.5px] text-slate-600">(Ký, họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <span className="font-bold text-black text-[12px]">
                        {data.receiverName || data.creatorName || 'Nguyễn Văn Tiến'}
                      </span>
                    </div>
                  </div>

                  {/* 2. Người giao */}
                  <div className="space-y-1">
                    <p className="font-bold text-black uppercase">Người giao</p>
                    <p className="italic text-[10.5px] text-slate-600">(Ký, họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <span className="font-bold text-black text-[12px]">
                        {data.delivererName || 'Bên giao hàng'}
                      </span>
                    </div>
                  </div>

                  {/* 3. Phụ trách kỹ thuật */}
                  <div className="space-y-1">
                    <p className="font-bold text-black uppercase">Phụ trách kỹ thuật</p>
                    <p className="italic text-[10.5px] text-slate-600">(Ký, họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <span className="font-bold text-black text-[12px]">
                        {data.technicianName || 'Bùi Đức Duy'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : isRepairMaterialExport ? (
                /* Mẫu số: 02 - VT trong phần Lập Phiếu Sửa Chữa: Người lập phiếu, Người nhận hàng, Xưởng đồng hồ */
                <div className="voucher-signature-grid grid grid-cols-3 gap-4 text-center text-[12px]">
                  {/* 1. Người lập phiếu */}
                  <div className="space-y-1">
                    <p className="font-bold text-black uppercase">Người lập phiếu</p>
                    <p className="italic text-[10.5px] text-slate-600">(Ký, họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <span className="font-bold text-black text-[12px]">
                        {creatorName || data.creatorName || 'Lương Phương Thảo'}
                      </span>
                    </div>
                  </div>

                  {/* 2. Người nhận hàng */}
                  <div className="space-y-1">
                    <p className="font-bold text-black uppercase">Người nhận hàng</p>
                    <p className="italic text-[10.5px] text-slate-600">(Ký, họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <span className="font-bold text-black text-[12px]">
                        {receiverName || data.receiverName || 'Nguyễn Văn Tiến'}
                      </span>
                    </div>
                  </div>

                  {/* 3. Xưởng đồng hồ */}
                  <div className="space-y-1">
                    <p className="font-bold text-black uppercase">Xưởng đồng hồ</p>
                    <p className="italic text-[10.5px] text-slate-600">(Ký, họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <span className="font-bold text-black text-[12px]">
                        {workshopManagerName || data.workshopManagerName || 'Bùi Đức Duy'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : isUnitDistributionExport ? (
                /* PHIẾU XIN LĨNH (Xuất ĐH 12 đơn vị): Người lập phiếu, Người giao (tên đơn vị), Phụ trách kỹ thuật */
                <div className="voucher-signature-grid grid grid-cols-3 gap-4 text-center text-[12px]">
                  {/* 1. Người lập phiếu */}
                  <div className="space-y-1">
                    <p className="font-bold text-black uppercase">Người lập phiếu</p>
                    <p className="italic text-[10.5px] text-slate-600">(Ký, họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <span className="font-bold text-black text-[12px]">
                        {creatorName || data.creatorName || 'Nguyễn Văn Tiến'}
                      </span>
                    </div>
                  </div>

                  {/* 2. Người giao */}
                  <div className="space-y-1">
                    <p className="font-bold text-black uppercase">Người giao (Đơn vị)</p>
                    <p className="italic text-[10.5px] text-slate-600">(Ký, họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <span className="font-bold text-black text-[12px]">
                        {delivererName || data.delivererName || data.destinationOrSupplier || 'Đại diện đơn vị'}
                      </span>
                    </div>
                  </div>

                  {/* 3. Phụ trách kỹ thuật */}
                  <div className="space-y-1">
                    <p className="font-bold text-black uppercase">Phụ trách kỹ thuật</p>
                    <p className="italic text-[10.5px] text-slate-600">(Ký, họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <span className="font-bold text-black text-[12px]">
                        {technicianName || data.technicianName || 'Bùi Đức Duy'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Khu vực 5 chữ ký chuẩn quy định Việt Nam cho các phiếu xuất/nhập khác */
                <div className="voucher-signature-grid grid grid-cols-5 gap-2 text-center text-[11.5px]">
                  {/* 1. Người lập phiếu */}
                  <div className="space-y-1">
                    <p className="font-bold text-black uppercase">Người lập phiếu</p>
                    <p className="italic text-[10px] text-slate-600">(Ký, họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <span className="font-bold text-black text-[11px]">
                        {data.creatorName || 'Phạm Phương Đông'}
                      </span>
                    </div>
                  </div>

                  {/* 2. Người nhận / giao */}
                  <div className="space-y-1">
                    <p className="font-bold text-black uppercase">{isExport ? 'Người nhận' : 'Người giao'}</p>
                    <p className="italic text-[10px] text-slate-600">(Ký, họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <span className="font-bold text-black text-[11px]">
                        {isExport ? (data.receiverName || 'Đại diện đơn vị') : (data.delivererName || 'Bên giao hàng')}
                      </span>
                    </div>
                  </div>

                  {/* 3. Thủ kho */}
                  <div className="space-y-1">
                    <p className="font-bold text-black uppercase">Thủ kho</p>
                    <p className="italic text-[10px] text-slate-600">(Ký, họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <span className="font-bold text-black text-[11px]">Nguyễn Văn Kho</span>
                    </div>
                  </div>

                  {/* 4. Kế toán trưởng / Phụ trách */}
                  <div className="space-y-1">
                    <p className="font-bold text-black uppercase">Kế toán trưởng</p>
                    <p className="italic text-[10px] text-slate-600">(Ký, họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <span className="font-bold text-black text-[11px]">Phụ trách kế toán</span>
                    </div>
                  </div>

                  {/* 5. Giám đốc / Thủ trưởng đơn vị */}
                  <div className="space-y-1">
                    <p className="font-bold text-black uppercase">Thủ trưởng</p>
                    <p className="italic text-[10px] text-slate-600">(Ký, đóng dấu)</p>
                    <div className="h-20 flex items-end justify-center">
                      <span className="font-bold text-black text-[11px]">Ban Giám Đốc</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom note */}
            <div className="pt-4 border-t border-slate-200 text-[10.5px] text-slate-500 flex justify-between items-center print:border-t print:mt-4">
              <span>Hệ thống Quản lý Kho Đồng hồ & Vật tư SOWASUCO WM</span>
              <span>In lúc: {new Date().toLocaleString('vi-VN')}</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
