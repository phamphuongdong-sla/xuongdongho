import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Tải file mẫu Excel nhập kho linh kiện và đồng hồ mới
export async function GET() {
  try {
    const [meters, spareParts] = await Promise.all([
      prisma.meter.findMany({
        where: { category: { not: 'Sửa chữa' } },
        orderBy: { code: 'asc' },
      }),
      prisma.sparePart.findMany({
        orderBy: { code: 'asc' },
      }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SOWASUCO Water Meter Management System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Danh Mục Nhập Kho', {
      views: [{ showGridLines: true }],
    });

    sheet.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'Phân Loại', key: 'type', width: 16 },
      { header: 'Mã Hàng', key: 'code', width: 16 },
      { header: 'Tên Sản Phẩm / Vật Tư', key: 'name', width: 38 },
      { header: 'ĐVT', key: 'unit', width: 8 },
      { header: 'Đơn Giá (VNĐ)', key: 'price', width: 16 },
      { header: 'Số Lượng Nhập (Điền vào đây)', key: 'quantity', width: 28 },
      { header: 'Ghi Chú', key: 'notes', width: 22 },
    ];

    // Header styling
    const headerRow = sheet.getRow(1);
    headerRow.height = 32;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    headerRow.eachCell((cell, colNumber) => {
      if (colNumber === 7) {
        // Cột "Số Lượng Nhập" nổi bật màu cam
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD97706' },
        };
      } else {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0284C7' },
        };
      }
    });

    let stt = 1;

    // 1. Nhóm Đồng Hồ Mới
    for (const m of meters) {
      const row = sheet.addRow({
        stt: stt++,
        type: 'Đồng hồ mới',
        code: m.code,
        name: m.name,
        unit: m.unit || 'Cái',
        price: m.unitPrice || 0,
        quantity: '', // Để trống cho người dùng điền
        notes: '',
      });

      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(2).alignment = { horizontal: 'center' };
      row.getCell(3).font = { bold: true, name: 'Courier New' };
      row.getCell(5).alignment = { horizontal: 'center' };
      row.getCell(6).numFmt = '#,##0';
      row.getCell(7).alignment = { horizontal: 'right' };
      row.getCell(7).font = { bold: true, color: { argb: 'FFB45309' } };
      row.getCell(7).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFBEB' }, // vàng nhạt
      };
    }

    // 2. Nhóm Vật Tư Linh Kiện Sửa Chữa
    for (const sp of spareParts) {
      const row = sheet.addRow({
        stt: stt++,
        type: 'Vật tư linh kiện',
        code: sp.code,
        name: sp.name,
        unit: sp.unit || 'Cái',
        price: sp.unitPrice || 0,
        quantity: '', // Để trống cho người dùng điền
        notes: '',
      });

      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(2).alignment = { horizontal: 'center' };
      row.getCell(3).font = { bold: true, name: 'Courier New' };
      row.getCell(5).alignment = { horizontal: 'center' };
      row.getCell(6).numFmt = '#,##0';
      row.getCell(7).alignment = { horizontal: 'right' };
      row.getCell(7).font = { bold: true, color: { argb: 'FFB45309' } };
      row.getCell(7).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFBEB' }, // vàng nhạt
      };
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Mau_Nhap_Kho_Hop_Dong_SOWASUCO.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('Error generating template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Đọc file Excel người dùng đã điền số lượng để nạp tự động vào phiếu nhập
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Vui lòng chọn file Excel!' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const sheet = workbook.getWorksheet(1);
    if (!sheet) {
      return NextResponse.json({ error: 'File Excel không có dữ liệu bảng tính!' }, { status: 400 });
    }

    const [meters, spareParts] = await Promise.all([
      prisma.meter.findMany(),
      prisma.sparePart.findMany(),
    ]);

    const items: Array<{
      itemType: 'meter' | 'spare_part';
      itemId: number;
      code: string;
      name: string;
      unit: string;
      unitPrice: number;
      quantity: number;
    }> = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 1) return; // Bỏ qua tiêu đề

      const codeRaw = row.getCell(3).value;
      const code = String(codeRaw || '').trim();
      const nameRaw = row.getCell(4).value;
      const name = String(nameRaw || '').trim();

      const qtyVal = row.getCell(7).value;
      let quantity = 0;
      if (typeof qtyVal === 'number') {
        quantity = Math.floor(qtyVal);
      } else if (typeof qtyVal === 'string') {
        quantity = parseInt(qtyVal.replace(/[^0-9]/g, ''), 10) || 0;
      }

      if (quantity > 0) {
        // Kiểm tra xem là meter hay spare part
        const matchedMeter = meters.find(m => m.code === code || m.name.toLowerCase() === name.toLowerCase());
        if (matchedMeter) {
          items.push({
            itemType: 'meter',
            itemId: matchedMeter.id,
            code: matchedMeter.code,
            name: matchedMeter.name,
            unit: matchedMeter.unit || 'Cái',
            unitPrice: matchedMeter.unitPrice || 0,
            quantity,
          });
          return;
        }

        const matchedPart = spareParts.find(p => p.code === code || p.name.toLowerCase() === name.toLowerCase());
        if (matchedPart) {
          items.push({
            itemType: 'spare_part',
            itemId: matchedPart.id,
            code: matchedPart.code,
            name: matchedPart.name,
            unit: matchedPart.unit || 'Cái',
            unitPrice: matchedPart.unitPrice || 0,
            quantity,
          });
        }
      }
    });

    const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);

    return NextResponse.json({
      success: true,
      count: items.length,
      totalQuantity,
      items,
    });
  } catch (error: any) {
    console.error('Error parsing excel template:', error);
    return NextResponse.json({ error: 'Lỗi đọc file Excel: ' + error.message }, { status: 500 });
  }
}
