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

  const adminGmail = await prisma.user.create({
    data: {
      email: 'phamphuongdong@gmail.com',
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

  const khoGmail = await prisma.user.create({
    data: {
      email: 'phieulinhdonhho.cnsl@gmail.com',
      fullName: 'Nguyễn Văn Tiến',
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
  const d25MeterId = meterMap.get('ĐH025');
  const d32MeterId = meterMap.get('ĐH032');
  const part1 = partMap.get(1);
  const part2 = partMap.get(2);
  const part3 = partMap.get(3);
  const part4 = partMap.get(4);

  // 9.1 Seed ImportVouchers for Used Meters Recovery (Thu hồi ĐH cũ từ các đơn vị về xưởng)
  console.log('Seeding Used Meters Recovery Vouchers...');
  const usedUnits = [
    { code: 'XNCN-TP01', countD15: 20, countD25: 5, date: '2026-02-08', codeNum: 'TH-001' },
    { code: 'XNCN-TP02', countD15: 15, countD25: 0, date: '2026-02-12', codeNum: 'TH-002' },
    { code: 'XNCN-MS',   countD15: 12, countD25: 3, date: '2026-02-25', codeNum: 'TH-003' },
    { code: 'CNCN-MC',   countD15: 18, countD25: 4, date: '2026-03-05', codeNum: 'TH-004' },
    { code: 'CNCN-YC',   countD15: 10, countD25: 0, date: '2026-03-15', codeNum: 'TH-005' },
    { code: 'CNCN-SM',   countD15: 8,  countD25: 2, date: '2026-03-22', codeNum: 'TH-006' },
  ];

  for (const item of usedUnits) {
    const srcUnitId = unitMap.get(item.code);
    if (!srcUnitId) continue;

    const totalQty = item.countD15 + item.countD25;
    const estAmount = totalQty * 80000;

    const impV = await prisma.importVoucher.create({
      data: {
        code: `PNK-2026-${item.codeNum}`,
        voucherDate: new Date(item.date),
        importReason: 'old_meters_return',
        unitId: khoVpId,
        sourceUnitId: srcUnitId,
        delivererName: 'Cán bộ kỹ thuật chi nhánh',
        receiverName: 'Nguyễn Văn Tiến',
        technicianName: 'Trần Kỹ Thuật',
        customerDeptName: 'Phòng Quản lý Khách hàng',
        createdBy: khoUser.id,
        status: 'completed',
        totalAmount: estAmount,
        notes: `Tiếp nhận đồng hồ tháo gỡ cũ từ đơn vị ${item.code} về xưởng bảo dưỡng, sửa chữa quay vòng`,
      },
    });

    if (d15MeterId && item.countD15 > 0) {
      await prisma.importVoucherDetail.create({
        data: {
          importVoucherId: impV.id,
          meterId: d15MeterId,
          quantity: item.countD15,
          unitPrice: 80000,
          lineAmount: item.countD15 * 80000,
          status: 'sent_for_repair',
          notes: 'Đồng hồ cũ tháo gỡ chờ kiểm định & sửa chữa',
        },
      });
    }

    if (d25MeterId && item.countD25 > 0) {
      await prisma.importVoucherDetail.create({
        data: {
          importVoucherId: impV.id,
          meterId: d25MeterId,
          quantity: item.countD25,
          unitPrice: 120000,
          lineAmount: item.countD25 * 120000,
          status: 'sent_for_repair',
          notes: 'Đồng hồ DN25 cũ cần thay buồng đo',
        },
      });
    }
  }

  // 9.2 Seed Contract Import Vouchers (Nhập kho theo hợp đồng)
  console.log('Seeding Contract Import Vouchers...');
  const batches = await prisma.contractBatch.findMany({ where: { contractId: contract.id } });
  if (batches.length > 0) {
    const batch1 = batches[0];
    const impContract = await prisma.importVoucher.create({
      data: {
        code: 'PNK-2026-HD001',
        voucherDate: new Date('2026-01-12'),
        importReason: 'purchase_contract',
        contractId: contract.id,
        contractBatchId: batch1.id,
        unitId: khoVpId,
        delivererName: 'Đại diện Công ty CP Thiết bị Nước Sài Gòn',
        receiverName: 'Nguyễn Văn Tiến',
        technicianName: 'Trần Kỹ Thuật',
        createdBy: khoUser.id,
        status: 'completed',
        totalAmount: 85000000,
        notes: 'Nhập kho đợt 1 linh kiện đồng hồ D15 theo hợp đồng HD-2026-LINHKIEN',
      },
    });

    if (part1 && part2 && part3) {
      await prisma.importVoucherDetail.createMany({
        data: [
          { importVoucherId: impContract.id, sparePartId: part1, quantity: 500, unitPrice: 14300, lineAmount: 500 * 14300, status: 'new', notes: 'Nắp D15 mới' },
          { importVoucherId: impContract.id, sparePartId: part2, quantity: 400, unitPrice: 22750, lineAmount: 400 * 22750, status: 'new', notes: 'Chụp xoay D15 mới' },
          { importVoucherId: impContract.id, sparePartId: part3, quantity: 300, unitPrice: 48000, lineAmount: 300 * 48000, status: 'new', notes: 'Mặt số D15 mới' },
        ],
      });
    }
  }

  // 9.3 Seed Repair Vouchers (Phiếu sửa chữa xưởng)
  console.log('Seeding Workshop Repair Vouchers...');
  if (d15MeterId) {
    const repairsData = [
      { code: 'PSC-2026-0001', date: '2026-02-15', inQty: 20, doneQty: 18, scrapQty: 2, mId: d15MeterId, notes: 'Bảo dưỡng sửa chữa đồng hồ D15 đợt 1' },
      { code: 'PSC-2026-0002', date: '2026-02-28', inQty: 15, doneQty: 15, scrapQty: 0, mId: d15MeterId, notes: 'Thay thế buồng đo và gioăng mặt số D15' },
      { code: 'PSC-2026-0003', date: '2026-03-10', inQty: 10, doneQty: 9, scrapQty: 1, mId: d25MeterId || d15MeterId, notes: 'Sửa chữa đồng hồ D25 chi nhánh Mộc Châu gửi' },
      { code: 'PSC-2026-0004', date: '2026-03-20', inQty: 12, doneQty: 12, scrapQty: 0, mId: d15MeterId, notes: 'Vệ sinh, căn chỉnh vít bù lưu lượng và hiệu chuẩn' },
      { code: 'PSC-2026-0005', date: '2026-04-05', inQty: 16, doneQty: 15, scrapQty: 1, mId: d15MeterId, notes: 'Hoàn tất sửa chữa lô ĐH cũ Yên Châu và Mai Sơn' },
    ];

    for (const r of repairsData) {
      const repVoucher = await prisma.repairVoucher.create({
        data: {
          code: r.code,
          repairDate: new Date(r.date),
          workshopUnitId: khoVpId,
          meterId: r.mId,
          inputQuantity: r.inQty,
          completedQuantity: r.doneQty,
          scrappedQuantity: r.scrapQty,
          createdBy: adminUser.id,
          technicianId: ktvUser.id,
          status: 'completed',
          notes: r.notes,
        },
      });

      if (part1 && part2) {
        await prisma.repairVoucherSparePart.createMany({
          data: [
            { repairVoucherId: repVoucher.id, sparePartId: part1, quantity: r.doneQty, unitPrice: 14300 },
            { repairVoucherId: repVoucher.id, sparePartId: part2, quantity: r.doneQty, unitPrice: 22750 },
          ],
        });
      }
    }
  }

  // 9.4 Seed Export Vouchers (Phiếu xuất cấp phát cho các đơn vị)
  console.log('Seeding Export Distribution Vouchers...');
  const distPlans = [
    { code: 'PXK-2026-0001', unitCode: 'XNCN-TP01', date: '2026-02-20', qty: 18, notes: 'Xuất cấp trả 18 đồng hồ D15 quay vòng sau sửa chữa cho TP1' },
    { code: 'PXK-2026-0002', unitCode: 'XNCN-TP02', date: '2026-03-02', qty: 15, notes: 'Xuất cấp 15 đồng hồ D15 quay vòng phục vụ thay thế khách hàng' },
    { code: 'PXK-2026-0003', unitCode: 'XNCN-MS',   date: '2026-03-12', qty: 10, notes: 'Cấp phát 10 đồng hồ D15 theo kế hoạch quý 1' },
    { code: 'PXK-2026-0004', unitCode: 'CNCN-MC',   date: '2026-03-25', qty: 12, notes: 'Cấp phát đồng hồ thay thế định kỳ cho CNCN Mộc Châu' },
    { code: 'PXK-2026-0005', unitCode: 'CNCN-YC',   date: '2026-04-10', qty: 10, notes: 'Xuất kho đồng hồ quay vòng cho CNCN Yên Châu' },
    { code: 'PXK-2026-0006', unitCode: 'CNCN-SM',   date: '2026-04-18', qty: 8,  notes: 'Xuất cấp phát đồng hồ cho CNCN Sông Mã' },
  ];

  for (const dp of distPlans) {
    const destUnitId = unitMap.get(dp.unitCode);
    if (!destUnitId || !d15MeterId) continue;

    const expV = await prisma.exportVoucher.create({
      data: {
        code: dp.code,
        voucherDate: new Date(dp.date),
        exportReason: 'unit_distribution',
        unitId: khoVpId,
        destinationUnitId: destUnitId,
        delivererName: 'Nguyễn Văn Tiến',
        receiverName: 'Đại diện nhận hàng chi nhánh',
        createdBy: khoUser.id,
        status: 'completed',
        totalAmount: dp.qty * 120000,
        notes: dp.notes,
      },
    });

    await prisma.exportVoucherDetail.create({
      data: {
        exportVoucherId: expV.id,
        meterId: d15MeterId,
        quantity: dp.qty,
        unitPrice: 120000,
        lineAmount: dp.qty * 120000,
        status: 'circulating',
        notes: 'Đồng hồ quay vòng xưởng đã kiểm định đạt',
      },
    });
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
