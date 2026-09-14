import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import excelOracle from '@/data/excel-oracle.json';

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SOWASUCO WM System';
    workbook.lastModifiedBy = 'Admin';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Sheet 1: Báo cáo Tồn Kho Thực Tế
    const sheet1 = workbook.addWorksheet('Tồn Kho Thực Thời', {
      views: [{ showGridLines: true }],
    });

    sheet1.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'Đơn Vị Quản Lý', key: 'unit', width: 28 },
      { header: 'Mã Sản Phẩm', key: 'code', width: 18 },
      { header: 'Tên Sản Phẩm / Vật Tư', key: 'name', width: 36 },
      { header: 'Phân Loại', key: 'type', width: 14 },
      { header: 'Tình Trạng', key: 'status', width: 16 },
      { header: 'ĐVT', key: 'unitName', width: 8 },
      { header: 'Số Lượng', key: 'quantity', width: 12 },
    ];

    // Header styling
    const headerRow = sheet1.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0284C7' },
    };

    const inventories = await prisma.inventory.findMany({
      include: {
        unit: true,
        meter: true,
        sparePart: true,
      },
      orderBy: [
        { unit: { sortOrder: 'asc' } },
        { quantity: 'desc' },
      ],
    });

    const statusLabels: Record<string, string> = {
      new: 'Mới 100%',
      circulating: 'Quay vòng (Đã sửa)',
      sent_for_repair: 'Chờ sửa chữa',
      broken: 'Hỏng / Thanh lý',
    };

    inventories.forEach((inv, index) => {
      const isMeter = !!inv.meter;
      const code = isMeter ? inv.meter!.code : inv.sparePart!.code;
      const name = isMeter ? inv.meter!.name : inv.sparePart!.name;
      const unitName = isMeter ? inv.meter!.unit : inv.sparePart!.unit;

      sheet1.addRow({
        stt: index + 1,
        unit: inv.unit.name,
        code,
        name,
        type: isMeter ? 'Đồng hồ' : 'Linh kiện',
        status: statusLabels[inv.status] || inv.status,
        unitName,
        quantity: inv.quantity,
      });
    });

    // Sheet 2: Đối soát Đồng Hồ Nước (Bám sát file Excel Nhập Xuất ĐH 2026.xlsx)
    const oracle = excelOracle as any;
    if (oracle && oracle.meters) {
      const sheet2 = workbook.addWorksheet('Đối Soát ĐH 2026', {
        views: [{ showGridLines: true }],
      });

      sheet2.columns = [
        { header: 'Mã Hàng', key: 'code', width: 18 },
        { header: 'Tên Sản Phẩm', key: 'name', width: 36 },
        { header: 'ĐVT', key: 'unit', width: 8 },
        { header: 'Đầu Kỳ', key: 'opening', width: 12 },
        { header: 'Nhập Kho', key: 'import', width: 14 },
        { header: 'Xuất Kho', key: 'export', width: 14 },
        { header: 'Cuối Kỳ', key: 'ending', width: 14 },
        { header: 'Công Thức Cân Đối', key: 'balance', width: 18 },
      ];

      const rowH2 = sheet2.getRow(1);
      rowH2.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      rowH2.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF075985' },
      };

      oracle.meters.forEach((m: any) => {
        sheet2.addRow({
          code: m.code,
          name: m.name,
          unit: m.unit,
          opening: m.opening,
          import: m.import,
          export: m.export,
          ending: m.ending,
          balance: m.formula_balance,
        });
      });

      // Sheet 3: Vật Tư Sửa Chữa (Bám sát file Excel Nhập xuất vật tư sửa chữa 2026.xlsx)
      const sheet3 = workbook.addWorksheet('Vật Tư Sửa Chữa 2026', {
        views: [{ showGridLines: true }],
      });

      sheet3.columns = [
        { header: 'STT', key: 'stt', width: 6 },
        { header: 'Tên Vật Tư', key: 'name', width: 36 },
        { header: 'ĐVT', key: 'unit', width: 8 },
        { header: 'Tồn Đầu Kỳ', key: 'opening', width: 12 },
        { header: 'Tổng Nhập', key: 'import', width: 14 },
        { header: 'Tổng Sử Dụng', key: 'used', width: 14 },
        { header: 'Tồn Cuối Kỳ', key: 'ending', width: 14 },
      ];

      const rowH3 = sheet3.getRow(1);
      rowH3.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      rowH3.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0369A1' },
      };

      oracle.spare_parts.forEach((p: any) => {
        sheet3.addRow({
          stt: p.stt,
          name: p.name.replace(/\n/g, ' '),
          unit: p.unit,
          opening: p.opening,
          import: p.total_import,
          used: p.total_used,
          ending: p.ending,
        });
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="SOWASUCO_WM_BaoCao_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
