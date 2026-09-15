import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

// Data from the user's uploaded image
const METER_IMPORTS: Record<string, number[]> = {
  // Code: [L1, L2, L3, L4, L5, L6]
  'ĐH015':   [500, 1000, 500,    0,    0,    0], // Multimag DN15 mm (2000)
  'D25FLD':  [  0,    5,  15,    0,    0,    0], // Flodis DN25 mm (20)
  'D32FLD':  [  0,    5,  35,    0,    0,    0], // Flodis DN32 mm (40)
  'D40FLT':  [  0,    5,  14,    0,    1,    5], // Flostar DN40 mm (25)
  'ĐH065':   [  2,    2,   0,    0,    0,    0], // Woltex DN65 mm (4)
  'ĐH080':   [  4,    0,   0,    0,    0,    0], // Woltex DN80 mm (4)
  'ĐH100':   [  4,    2,   2,    0,    0,    0], // Woltex DN100 mm (8)
  'ĐH150':   [  0,    2,   0,    0,    0,    0], // Woltex DN150 mm (2)
  'ĐH200':   [  0,    0,   0,    0,    0,    0], // Woltex DN200 mm (0)
};

const PART_IMPORTS: Record<string, number[]> = {
  // Code: [L1, L2, L3, L4, L5, L6]
  'VP-D15-001': [4500, 0, 1000, 2000, 1500, 0], // Nắp đồng hồ DN15 (9000)
  'VP-D15-002': [4500, 0, 1000,    0, 3500, 0], // Chụp xoay DN15 (9000)
  'VP-D15-004': [2500, 0, 1000,    0,  500, 0], // Mặt số DN15 (4000)
  'VP-D15-005': [ 800, 0, 1000,    0,    0, 0], // Nắp chặn trên BĐ DN15 (1800)
  'VP-D15-006': [4500, 0, 1000,    0, 3500, 0], // Cánh quạt DN15 (9000)
  'VP-D15-007': [4500, 0, 1000,    0, 3500, 0], // Buồng đo DN15 (9000)
  'VP-D15-009': [4500, 0, 1000,    0, 3500, 0], // Gioăng nắp chặn trên BĐ DN15 (9000)
  'VP-D15-011': [2500, 0, 1000,    0, 1500, 0], // Bộ phận kháng từ DN15 (5000)
  'VP-D15-013': [2000, 0, 1000,    0,    0, 0], // Ốc chặn nút chỉnh DN15 (3000)
  'VP-D15-008': [4500, 0, 1000, 2000, 1500, 0], // Vít tinh chỉnh DN15 (9000)
  'VP-D15-012': [4500, 0, 1000, 2000, 1500, 0], // Gioăng buồng đo DN15 (9000)
  'VP-D15-010': [2000, 0, 1000,    0,    0, 0], // Gioăng ốc chặn nút chỉnh DN15 (3000)
};

const BATCH_DATES = [
  new Date('2026-01-15T08:00:00Z'), // Lần 1
  new Date('2026-03-20T08:00:00Z'), // Lần 2
  new Date('2026-05-18T08:00:00Z'), // Lần 3
  new Date('2026-06-25T08:00:00Z'), // Lần 4
  new Date('2026-07-22T08:00:00Z'), // Lần 5
  new Date('2026-08-30T08:00:00Z'), // Lần 6
];

const UNIT_KEY_TO_CODE: Record<string, string> = {
  'TP1': 'XNCN-SO1',
  'TP2': 'XNCN-SO02',
  'MS':  'XNCN-MS',
  'MC + Vân hồ': 'CNCN-MC',
  'YC':  'CNCN-YC',
  'BY':  'CNCN-BY',
  'TC':  'CNCN-TC',
  'PY':  'CNCN-PY',
  'ML':  'CNCN-ML',
  'SM':  'CNCN-SM',
  'SC':  'CN-SC',
  'QN':  'CNCN-QN'
};

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9'
];

async function main() {
  console.log('--- STARTING 2026 VOUCHERS GENERATION ---');

  const khoVp = await prisma.unit.findFirst({
    where: { OR: [{ code: 'KHO-VP' }, { type: 'Kho/Xưởng' }, { sortOrder: 0 }] }
  });
  if (!khoVp) throw new Error('Kho VP not found');

  const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
  const userId = adminUser?.id || 1;

  // 1. Fetch live meters and spare parts
  const allMeters = await prisma.meter.findMany();
  const meterMap = new Map<string, number>();
  allMeters.forEach(m => meterMap.set(m.code, m.id));

  const allParts = await prisma.sparePart.findMany();
  const partMap = new Map<string, number>();
  allParts.forEach(p => partMap.set(p.code, p.id));

  const allUnits = await prisma.unit.findMany();
  const unitCodeMap = new Map<string, number>();
  allUnits.forEach(u => unitCodeMap.set(u.code, u.id));

  // 2. Clear old contract & contract import vouchers
  console.log('Cleaning old contract import vouchers...');
  await prisma.importVoucherDetail.deleteMany({
    where: { importVoucher: { importReason: 'purchase_contract' } }
  });
  await prisma.importVoucher.deleteMany({
    where: { importReason: 'purchase_contract' }
  });
  await prisma.contractBatch.deleteMany({});
  await prisma.contract.deleteMany({});

  // 3. Create Contract 2026
  console.log('Creating official 2026 Contract...');
  const contract = await prisma.contract.create({
    data: {
      contractNumber: 'HD-2026-VATTU',
      title: 'Hợp đồng mua sắm vật tư đồng hồ nước và linh kiện thay thế năm 2026',
      supplierName: 'Công ty Cổ phần Thiết bị & Công nghệ Nước',
      signDate: new Date('2026-01-05T00:00:00Z'),
      totalValue: 1250000000,
      status: 'active',
      notes: 'Cung cấp đồng hồ và linh kiện theo 6 đợt giao hàng trong năm 2026',
    }
  });

  // 4. Create 6 Batches and 6 Import Vouchers
  console.log('Creating 6 contract batches and 6 import vouchers...');
  for (let batchIdx = 0; batchIdx < 6; batchIdx++) {
    const batchNum = batchIdx + 1;
    const batchDate = BATCH_DATES[batchIdx];
    const batchName = `Lần ${batchNum} - Đợt giao Tháng 0${batchDate.getUTCMonth() + 1}/2026`;

    const batch = await prisma.contractBatch.create({
      data: {
        contractId: contract.id,
        batchNumber: batchNum,
        batchName,
        expectedDate: batchDate,
        actualDate: batchDate,
        status: 'completed',
        notes: `Nhập kho đợt ${batchNum} theo tiến độ cung cấp`,
      }
    });

    const voucherCode = `PNK-2026-HD00${batchNum}`;
    const voucher = await prisma.importVoucher.create({
      data: {
        code: voucherCode,
        voucherDate: batchDate,
        importReason: 'purchase_contract',
        contractId: contract.id,
        contractBatchId: batch.id,
        unitId: khoVp.id,
        delivererName: 'Đại diện nhà cung cấp thiết bị nước',
        receiverName: 'Nguyễn Văn Tiến',
        technicianName: 'Bùi Đức Duy',
        createdBy: userId,
        status: 'completed',
        notes: `Nhập kho Lần ${batchNum} vật tư đồng hồ và linh kiện năm 2026`,
      }
    });

    // Details for this batch
    const detailsData: any[] = [];

    // Meters
    for (const [mCode, qtys] of Object.entries(METER_IMPORTS)) {
      const qty = qtys[batchIdx];
      if (qty > 0) {
        const meterId = meterMap.get(mCode);
        if (meterId) {
          detailsData.push({
            importVoucherId: voucher.id,
            meterId,
            quantity: qty,
            unitPrice: 350000,
            lineAmount: qty * 350000,
            status: 'new',
            notes: `Nhập mới Lần ${batchNum}`,
          });
        }
      }
    }

    // Spare parts
    for (const [pCode, qtys] of Object.entries(PART_IMPORTS)) {
      const qty = qtys[batchIdx];
      if (qty > 0) {
        const partId = partMap.get(pCode);
        if (partId) {
          detailsData.push({
            importVoucherId: voucher.id,
            sparePartId: partId,
            quantity: qty,
            unitPrice: 15000,
            lineAmount: qty * 15000,
            status: 'new',
            notes: `Nhập linh kiện Lần ${batchNum}`,
          });
        }
      }
    }

    if (detailsData.length > 0) {
      await prisma.importVoucherDetail.createMany({ data: detailsData });
    }
    console.log(`Created ${voucherCode} with ${detailsData.length} items`);
  }

  // 5. Generate Export Vouchers for Month 1 - Month 9
  console.log('Generating Export Vouchers from Month 1 to Month 9...');
  // Delete existing unit_distribution export vouchers to avoid duplicates
  await prisma.exportVoucherDetail.deleteMany({
    where: { exportVoucher: { exportReason: 'unit_distribution' } }
  });
  await prisma.exportVoucher.deleteMany({
    where: { exportReason: 'unit_distribution' }
  });

  const unitMonthlyData = JSON.parse(fs.readFileSync('./src/data/unit-monthly-exports.json', 'utf8'));
  let exportCount = 0;

  for (let mIdx = 0; mIdx < 9; mIdx++) {
    const monthNum = mIdx + 1;
    const mName = MONTH_NAMES[mIdx];
    const voucherDate = new Date(Date.UTC(2026, mIdx, 25, 8, 0, 0));

    for (const [uKey, uData] of Object.entries(unitMonthlyData.units as Record<string, any>)) {
      const uCode = UNIT_KEY_TO_CODE[uKey];
      const unitId = uCode ? unitCodeMap.get(uCode) : null;
      if (!unitId) continue;

      const itemsInMonth: Array<{ meterId: number; status: string; quantity: number }> = [];
      for (const m of uData.meters) {
        const mInfo = m.months?.[mName];
        if (!mInfo) continue;
        const meterId = meterMap.get(m.code);
        if (!meterId) continue;

        if (mInfo.new > 0) {
          itemsInMonth.push({ meterId, status: 'new', quantity: mInfo.new });
        }
        if (mInfo.circ > 0) {
          itemsInMonth.push({ meterId, status: 'circulating', quantity: mInfo.circ });
        }
      }

      if (itemsInMonth.length > 0) {
        exportCount++;
        const expCode = `PXK-2026-M${String(monthNum).padStart(2, '0')}-${String(exportCount).padStart(3, '0')}`;
        const expVoucher = await prisma.exportVoucher.create({
          data: {
            code: expCode,
            voucherDate,
            exportReason: 'unit_distribution',
            unitId: khoVp.id,
            destinationUnitId: unitId,
            delivererName: 'Nguyễn Văn Tiến',
            receiverName: `Đại diện ${uData.unitName}`,
            createdBy: userId,
            status: 'completed',
            notes: `Xuất cấp đồng hồ định kỳ ${mName}/2026 cho ${uData.unitName}`,
            details: {
              create: itemsInMonth.map(item => ({
                meterId: item.meterId,
                quantity: item.quantity,
                status: item.status,
                notes: `Cấp phát ${mName}/2026`,
              }))
            }
          }
        });
      }
    }
  }

  console.log(`Generated ${exportCount} Export Vouchers for 12 units from Month 1 to Month 9!`);
  console.log('--- ALL VOUCHERS GENERATION COMPLETE ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
