import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

const UNITS_DATA = [
  { code: 'KHO-VP', name: 'Xưởng đồng hồ', type: 'Kho/Xưởng', address: 'Ngõ 43, Tổ 6 Chiềng Lề - Phường Tô Hiệu - Tỉnh Sơn La', phone: '0212.3852.xxx', sortOrder: 0 },
  { code: 'XNCN-TP01', name: 'XNCN TP số 1', type: 'Xí nghiệp', address: 'TP Sơn La', phone: '0212.3852.001', sortOrder: 1 },
  { code: 'XNCN-TP02', name: 'XNCN TP số 2', type: 'Xí nghiệp', address: 'TP Sơn La', phone: '0212.3852.002', sortOrder: 2 },
  { code: 'XNCN-MS', name: 'XNCN Mai Sơn', type: 'Xí nghiệp', address: 'Huyện Mai Sơn', phone: '0212.3843.003', sortOrder: 3 },
  { code: 'CNCN-MC', name: 'CNCN Mộc Châu', type: 'Chi nhánh', address: 'Huyện Mộc Châu', phone: '0212.3866.004', sortOrder: 4 },
  { code: 'CNCN-YC', name: 'CNCN Yên Châu', type: 'Chi nhánh', address: 'Huyện Yên Châu', phone: '0212.3840.005', sortOrder: 5 },
  { code: 'CNCN-PY', name: 'CNCN Phù Yên', type: 'Chi nhánh', address: 'Huyện Phù Yên', phone: '0212.3863.008', sortOrder: 6 },
  { code: 'CNCN-BY', name: 'CNCN Bắc Yên', type: 'Chi nhánh', address: 'Huyện Bắc Yên', phone: '0212.3860.006', sortOrder: 7 },
  { code: 'CNCN-SM', name: 'CNCN Sông Mã', type: 'Chi nhánh', address: 'Huyện Sông Mã', phone: '0212.3836.010', sortOrder: 8 },
  { code: 'CN-SC', name: 'CNCN Sốp Cộp', type: 'Chi nhánh', address: 'Huyện Sốp Cộp', phone: '0212.3877.011', sortOrder: 9 },
  { code: 'CNCN-TC', name: 'CNCN Thuận Châu', type: 'Chi nhánh', address: 'Huyện Thuận Châu', phone: '0212.3847.007', sortOrder: 10 },
  { code: 'CNCN-ML', name: 'CNCN Mường La', type: 'Chi nhánh', address: 'Huyện Mường La', phone: '0212.3851.009', sortOrder: 11 },
  { code: 'CNCN-QN', name: 'CNCN Quỳnh Nhai', type: 'Chi nhánh', address: 'Huyện Quỳnh Nhai', phone: '0212.3872.012', sortOrder: 12 },
];

async function main() {
  console.log('--- Starting SOWASUCO WM Database Seeding ---');

  // Clean existing tables in proper order
  await prisma.auditLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.repairVoucherSparePart.deleteMany();
  await prisma.repairVoucher.deleteMany();
  await prisma.meterInspection.deleteMany();
  await prisma.transferVoucherDetail.deleteMany();
  await prisma.transferVoucher.deleteMany();
  await prisma.exportVoucherDetail.deleteMany();
  await prisma.exportVoucher.deleteMany();
  await prisma.importVoucherDetail.deleteMany();
  await prisma.importVoucher.deleteMany();
  await prisma.contractBatch.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.meterSparePart.deleteMany();
  await prisma.sparePart.deleteMany();
  await prisma.meter.deleteMany();
  await prisma.user.deleteMany();
  await prisma.unit.deleteMany();

  // 1. Seed Units
  console.log('Seeding Units...');
  const unitMap = new Map<string, number>();
  for (const u of UNITS_DATA) {
    const created = await prisma.unit.create({
      data: u,
    });
    unitMap.set(u.code, created.id);
  }
  const khoVpId = unitMap.get('KHO-VP')!;

  // 2. Seed Users
  console.log('Seeding Users...');
  const hashPassword = (password: string) => {
    const hash = crypto
      .createHash('sha256')
      .update(`sowasuco_wm_salt_2026_secure:${password}`)
      .digest('hex');
    return `sha256:${hash}`;
  };
  const demoPasswordHash = hashPassword('123456');

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@sowasuco.vn',
      fullName: 'Phạm Phương Đông',
      role: 'admin',
      passwordHash: demoPasswordHash,
      department: 'Phòng Quản lý Khách hàng',
      unitId: khoVpId,
    },
  });

  const khoUser = await prisma.user.create({
    data: {
      email: 'thukho@sowasuco.vn',
      fullName: 'Nguyễn Văn Kho',
      role: 'kho',
      passwordHash: demoPasswordHash,
      department: 'Bộ phận Kho vật tư',
      unitId: khoVpId,
    },
  });

  const ktvUser = await prisma.user.create({
    data: {
      email: 'ktv@sowasuco.vn',
      fullName: 'Trần Kỹ Thuật',
      role: 'ktv',
      passwordHash: demoPasswordHash,
      department: 'Xưởng sửa chữa đồng hồ',
      unitId: khoVpId,
    },
  });

  const accountantUser = await prisma.user.create({
    data: {
      email: 'ketoan@sowasuco.vn',
      fullName: 'Lê Thị Kế Toán',
      role: 'accountant',
      passwordHash: demoPasswordHash,
      department: 'Phòng Kế hoạch Tài chính',
      unitId: khoVpId,
    },
  });

  const xncnTp01Id = unitMap.get('XNCN-TP01') || khoVpId;
  const unitUser = await prisma.user.create({
    data: {
      email: 'chinhanh.tp1@sowasuco.vn',
      fullName: 'Lò Văn Nhánh',
      role: 'unit_user',
      passwordHash: demoPasswordHash,
      department: 'Xí nghiệp Cấp nước TP 1',
      unitId: xncnTp01Id,
    },
  });

  // 3. Load Excel Oracle
  const oraclePath = path.join(process.cwd(), 'tests', 'fixtures', 'excel-oracle.json');
  const oracle = JSON.parse(fs.readFileSync(oraclePath, 'utf8'));

  // 4. Seed Meters (25 models)
  console.log('Seeding Meters...');
  const meterMap = new Map<string, number>();
  const meterCodeCounts: Record<string, number> = {};

  for (const m of oracle.meters) {
    let code = m.code;
    meterCodeCounts[code] = (meterCodeCounts[code] || 0) + 1;
    if (meterCodeCounts[code] > 1) {
      code = `${m.code}-DV`; // Unique suffix for duplicate code in Excel row 8
    }

    let category = 'Tiêu chuẩn';
    let meterName = m.name;
    if (code === 'ĐH150-CTOR' || code.includes('150')) {
      category = 'Ngoại nhập';
      meterName = 'Đồng hồ nước DN150 CONTOR-Metcon';
    } else if (m.name.toLowerCase().includes('sửa chữa')) {
      category = 'Sửa chữa';
    } else if (m.name.toLowerCase().includes('thái') || m.name.toLowerCase().includes('flodis') || m.name.toLowerCase().includes('bermad')) {
      category = 'Ngoại nhập';
    }

    const created = await prisma.meter.create({
      data: {
        code,
        name: meterName,
        category,
        isActive: code !== 'ĐH015(SC)-DV',
        unit: m.unit || 'Cái',
        unitPrice: category === 'Sửa chữa' ? 120000 : 350000,
        depreciationPrice: category === 'Sửa chữa' ? 80000 : 250000,
      },
    });
    meterMap.set(code, created.id);

    // Initial meter inventory at KHO-VP based on Excel
    if (m.ending > 0) {
      await prisma.inventory.create({
        data: {
          unitId: khoVpId,
          meterId: created.id,
          quantity: Math.round(m.ending),
          status: category === 'Sửa chữa' ? 'circulating' : 'new',
        },
      });
    }
  }

  // 5. Seed Spare Parts (35 models)
  console.log('Seeding Spare Parts...');
  const partMap = new Map<number, number>();
  for (const p of oracle.spare_parts) {
    const code = p.stt <= 13 ? `VP-D15-${String(p.stt).padStart(3, '0')}` : `VP-${String(p.stt).padStart(3, '0')}`;
    let category = 'Linh kiện khác';
    const nameLower = p.name.toLowerCase();
    if (nameLower.includes('nắp')) category = 'Nắp';
    else if (nameLower.includes('chụp')) category = 'Chụp';
    else if (nameLower.includes('gioăng')) category = 'Gioăng';
    else if (nameLower.includes('mặt số')) category = 'Mặt số';
    else if (nameLower.includes('cánh quạt')) category = 'Cánh quạt';
    else if (nameLower.includes('buồng đo')) category = 'Buồng đo';
    else if (nameLower.includes('vít') || nameLower.includes('bù lưu lượng')) category = 'Vít tinh chỉnh';
    else if (nameLower.includes('chống từ')) category = 'Vành chống từ';
    else if (nameLower.includes('ốc')) category = 'Ốc chặn';

    const created = await prisma.sparePart.create({
      data: {
        code,
        name: p.name.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
        category,
        unit: p.unit || 'Cái',
        unitPrice: p.price || 0,
        minStock: 20,
      },
    });
    partMap.set(p.stt, created.id);

    // Initial spare part inventory at KHO-VP
    if (p.ending > 0) {
      await prisma.inventory.create({
        data: {
          unitId: khoVpId,
          sparePartId: created.id,
          quantity: Math.round(p.ending),
          status: 'new',
        },
      });
    }
  }

  // 6. Seed BOM Links for standard D15 meter
  console.log('Seeding BOM Links...');
  const d15MeterId = meterMap.get('ĐH015');
  if (d15MeterId) {
    for (let stt = 1; stt <= 12; stt++) {
      const partId = partMap.get(stt);
      if (partId) {
        await prisma.meterSparePart.create({
          data: {
            meterId: d15MeterId,
            sparePartId: partId,
            quantityPerSet: 1,
          },
        });
      }
    }
  }

  // 7. Seed Contract & Batches
  console.log('Seeding Contracts & Batches...');
  const contract = await prisma.contract.create({
    data: {
      contractNumber: 'HD-2026-LINHKIEN',
      title: 'Hợp đồng mua sắm vật tư linh kiện sửa chữa đồng hồ năm 2026',
      supplierName: 'Công ty Cổ phần Thiết bị & Công nghệ Nước Sài Gòn',
      signDate: new Date('2026-01-05'),
      totalValue: 350000000,
      status: 'active',
      notes: 'Hợp đồng mua theo nhiều đợt giao hàng trong năm 2026',
    },
  });

  await prisma.contractBatch.createMany({
    data: [
      {
        contractId: contract.id,
        batchNumber: 1,
        batchName: 'Đợt 1 - Cung ứng Tháng 01/2026',
        expectedDate: new Date('2026-01-10'),
        actualDate: new Date('2026-01-12'),
        status: 'completed',
        notes: 'Đã nhập kho đủ theo phiếu giao nhận đợt 1',
      },
      {
        contractId: contract.id,
        batchNumber: 2,
        batchName: 'Đợt 2 - Cung ứng Tháng 05/2026',
        expectedDate: new Date('2026-05-15'),
        actualDate: new Date('2026-05-18'),
        status: 'completed',
        notes: 'Bổ sung linh kiện D15 đợt cao điểm',
      },
      {
        contractId: contract.id,
        batchNumber: 3,
        batchName: 'Đợt 3 - Cung ứng Tháng 06/2026',
        expectedDate: new Date('2026-06-10'),
        actualDate: new Date('2026-06-14'),
        status: 'completed',
        notes: 'Bổ sung chụp xoay và gioăng',
      },
      {
        contractId: contract.id,
        batchNumber: 4,
        batchName: 'Đợt 4 - Cung ứng Tháng 07/2026',
        expectedDate: new Date('2026-07-20'),
        actualDate: new Date('2026-07-22'),
        status: 'completed',
        notes: 'Đợt linh kiện định kỳ quý 3',
      },
    ],
  });

  // 8. Seed Unit Initial Stocks for 12 branches
  console.log('Seeding 12 Units Stocks...');
  for (const [code, unitId] of unitMap.entries()) {
    if (code === 'KHO-VP') continue;

    if (d15MeterId) {
      await prisma.inventory.createMany({
        data: [
          { unitId, meterId: d15MeterId, quantity: 45, status: 'circulating' },
          { unitId, meterId: d15MeterId, quantity: 15, status: 'new' },
          { unitId, meterId: d15MeterId, quantity: 8, status: 'sent_for_repair' },
        ],
      });
    }
  }

  // 9. Seed Sample Vouchers for demonstration of workflows
  console.log('Seeding Sample Vouchers...');
  if (d15MeterId) {
    const repairVoucher = await prisma.repairVoucher.create({
      data: {
        code: 'PSC-2026-0001',
        repairDate: new Date('2026-02-15'),
        workshopUnitId: khoVpId,
        meterId: d15MeterId,
        inputQuantity: 20,
        completedQuantity: 18,
        scrappedQuantity: 2,
        createdBy: adminUser.id,
        technicianId: ktvUser.id,
        status: 'completed',
        notes: 'Sửa chữa đồng hồ quay vòng theo kế hoạch bảo dưỡng đợt 1',
      },
    });

    const part1 = partMap.get(1);
    const part2 = partMap.get(2);
    if (part1 && part2) {
      await prisma.repairVoucherSparePart.createMany({
        data: [
          { repairVoucherId: repairVoucher.id, sparePartId: part1, quantity: 18, unitPrice: 14300 },
          { repairVoucherId: repairVoucher.id, sparePartId: part2, quantity: 18, unitPrice: 22750 },
        ],
      });
    }

    const tp1UnitId = unitMap.get('XNCN-TP01');
    if (tp1UnitId) {
      await prisma.meterInspection.create({
        data: {
          code: 'PKD-2026-0001',
          inspectionDate: new Date('2026-02-10'),
          unitId: tp1UnitId,
          meterId: d15MeterId,
          quantityTotal: 25,
          passedQuantity: 5,
          repairQuantity: 18,
          failedQuantity: 2,
          inspectionType: 'incoming',
          inspectorId: ktvUser.id,
          notes: 'Tiếp nhận đồng hồ từ XN Cấp nước TP1 gửi về xưởng kiểm tra định kỳ',
        },
      });

      const exportVoucher = await prisma.exportVoucher.create({
        data: {
          code: 'PXK-2026-0001',
          voucherDate: new Date('2026-02-20'),
          exportReason: 'unit_distribution',
          unitId: khoVpId,
          destinationUnitId: tp1UnitId,
          createdBy: khoUser.id,
          status: 'completed',
          totalAmount: 18 * 120000,
          notes: 'Xuất trả 18 đồng hồ D15 đã sửa chữa hoàn tất cho TP1',
        },
      });

      await prisma.exportVoucherDetail.create({
        data: {
          exportVoucherId: exportVoucher.id,
          meterId: d15MeterId,
          quantity: 18,
          unitPrice: 120000,
          lineAmount: 18 * 120000,
          status: 'circulating',
          notes: 'Đồng hồ quay vòng xưởng đã kiểm định đạt',
        },
      });
    }
  }

  // 10. Sample Alerts
  await prisma.alert.createMany({
    data: [
      {
        unitId: khoVpId,
        alertType: 'low_stock',
        message: 'Mặt số đồng hồ D15 (VP-004) tồn kho chỉ còn 560 cái, sắp chạm mức cảnh báo.',
        isRead: false,
      },
      {
        unitId: khoVpId,
        alertType: 'low_stock',
        message: 'Đồng hồ D40 tồn kho hiện tại chỉ còn 4 cái.',
        isRead: false,
      },
    ],
  });

  console.log('--- Database Seeding Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
