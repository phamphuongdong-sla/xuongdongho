PRAGMA foreign_keys=OFF;

CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT,
    "unitId" INTEGER,
    "role" TEXT NOT NULL DEFAULT 'kho',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Meter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "size" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'Cái',
    "manufacturer" TEXT,
    "yearManufacture" INTEGER,
    "unitPrice" REAL DEFAULT 0,
    "depreciationPrice" REAL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "SparePart" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "size" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'Cái',
    "unitPrice" REAL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "MeterSparePart" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "meterId" INTEGER NOT NULL,
    "sparePartId" INTEGER NOT NULL,
    "quantityPerSet" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeterSparePart_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MeterSparePart_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Contract" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "signDate" DATETIME,
    "totalValue" REAL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ContractBatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractId" INTEGER NOT NULL,
    "batchNumber" INTEGER NOT NULL,
    "batchName" TEXT NOT NULL,
    "expectedDate" DATETIME,
    "actualDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContractBatch_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Inventory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unitId" INTEGER NOT NULL,
    "meterId" INTEGER,
    "sparePartId" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'new',
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inventory_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inventory_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inventory_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ImportVoucherDetail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "importVoucherId" INTEGER NOT NULL,
    "meterId" INTEGER,
    "sparePartId" INTEGER,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "lineAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportVoucherDetail_importVoucherId_fkey" FOREIGN KEY ("importVoucherId") REFERENCES "ImportVoucher" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ImportVoucherDetail_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ImportVoucherDetail_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ExportVoucher" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "voucherDate" DATETIME NOT NULL,
    "exportReason" TEXT NOT NULL,
    "unitId" INTEGER NOT NULL,
    "destinationUnitId" INTEGER,
    "createdBy" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL, "delivererName" TEXT, "receiverName" TEXT,
    CONSTRAINT "ExportVoucher_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExportVoucher_destinationUnitId_fkey" FOREIGN KEY ("destinationUnitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ExportVoucher_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "ExportVoucherDetail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "exportVoucherId" INTEGER NOT NULL,
    "meterId" INTEGER,
    "sparePartId" INTEGER,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "lineAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExportVoucherDetail_exportVoucherId_fkey" FOREIGN KEY ("exportVoucherId") REFERENCES "ExportVoucher" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExportVoucherDetail_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ExportVoucherDetail_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "TransferVoucher" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "voucherDate" DATETIME NOT NULL,
    "fromUnitId" INTEGER NOT NULL,
    "toUnitId" INTEGER NOT NULL,
    "transferType" TEXT NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalQuantity" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TransferVoucher_fromUnitId_fkey" FOREIGN KEY ("fromUnitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TransferVoucher_toUnitId_fkey" FOREIGN KEY ("toUnitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TransferVoucher_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "TransferVoucherDetail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "transferVoucherId" INTEGER NOT NULL,
    "meterId" INTEGER,
    "sparePartId" INTEGER,
    "quantity" INTEGER NOT NULL,
    "meterStatus" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransferVoucherDetail_transferVoucherId_fkey" FOREIGN KEY ("transferVoucherId") REFERENCES "TransferVoucher" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TransferVoucherDetail_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TransferVoucherDetail_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "RepairVoucher" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "repairDate" DATETIME NOT NULL,
    "workshopUnitId" INTEGER NOT NULL,
    "meterId" INTEGER NOT NULL,
    "inputQuantity" INTEGER NOT NULL,
    "completedQuantity" INTEGER NOT NULL DEFAULT 0,
    "scrappedQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdBy" INTEGER NOT NULL,
    "technicianId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL, "delivererName" TEXT, "receiverName" TEXT,
    CONSTRAINT "RepairVoucher_workshopUnitId_fkey" FOREIGN KEY ("workshopUnitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RepairVoucher_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RepairVoucher_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RepairVoucher_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "RepairVoucherSparePart" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "repairVoucherId" INTEGER NOT NULL,
    "sparePartId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RepairVoucherSparePart_repairVoucherId_fkey" FOREIGN KEY ("repairVoucherId") REFERENCES "RepairVoucher" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RepairVoucherSparePart_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "MeterInspection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "inspectionDate" DATETIME NOT NULL,
    "transferVoucherId" INTEGER,
    "unitId" INTEGER NOT NULL,
    "meterId" INTEGER NOT NULL,
    "quantityTotal" INTEGER NOT NULL,
    "passedQuantity" INTEGER NOT NULL DEFAULT 0,
    "failedQuantity" INTEGER NOT NULL DEFAULT 0,
    "repairQuantity" INTEGER NOT NULL DEFAULT 0,
    "inspectionType" TEXT NOT NULL DEFAULT 'incoming',
    "inspectorId" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MeterInspection_transferVoucherId_fkey" FOREIGN KEY ("transferVoucherId") REFERENCES "TransferVoucher" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MeterInspection_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MeterInspection_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MeterInspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" INTEGER,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unitId" INTEGER,
    "meterId" INTEGER,
    "sparePartId" INTEGER,
    "alertType" TEXT NOT NULL DEFAULT 'low_stock',
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Alert_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Alert_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "code" TEXT,
    "phone" TEXT,
    "unitId" INTEGER,
    "department" TEXT,
    "position" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employee_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ImportVoucher" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "voucherDate" DATETIME NOT NULL,
    "importReason" TEXT NOT NULL,
    "contractId" INTEGER,
    "contractBatchId" INTEGER,
    "unitId" INTEGER NOT NULL,
    "sourceUnitId" INTEGER,
    "delivererName" TEXT,
    "receiverName" TEXT,
    "createdBy" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL, "customerDeptName" TEXT, "technicianName" TEXT,
    CONSTRAINT "ImportVoucher_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ImportVoucher_contractBatchId_fkey" FOREIGN KEY ("contractBatchId") REFERENCES "ContractBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ImportVoucher_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ImportVoucher_sourceUnitId_fkey" FOREIGN KEY ("sourceUnitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ImportVoucher_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Unit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "User" VALUES(23,'admin@sowasuco.vn','sha256:5c3e7465678751e7719e02c1707dfd1868689554a005b577ec942476d2844c84','Phạm Phương Đông',NULL,'Phòng Quản lý Khách hàng',66,'admin',1,'2026-09-14 07:23:18','2026-09-14 07:23:17','2026-09-14 07:23:18');
INSERT INTO "User" VALUES(24,'phamphuongdong@gmail.com','sha256:5c3e7465678751e7719e02c1707dfd1868689554a005b577ec942476d2844c84','Phạm Phương Đông',NULL,'Phòng Quản lý Khách hàng',66,'admin',1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "User" VALUES(25,'thukho@sowasuco.vn','sha256:5c3e7465678751e7719e02c1707dfd1868689554a005b577ec942476d2844c84','Nguyễn Văn Kho',NULL,'Bộ phận Kho vật tư',66,'kho',1,'2026-09-14 07:23:18','2026-09-14 07:23:17','2026-09-14 07:23:18');
INSERT INTO "User" VALUES(26,'phieulinhdonhho.cnsl@gmail.com','sha256:5c3e7465678751e7719e02c1707dfd1868689554a005b577ec942476d2844c84','Nguyễn Văn Tiến',NULL,'Bộ phận Kho vật tư',66,'kho',1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "User" VALUES(27,'ktv@sowasuco.vn','sha256:5c3e7465678751e7719e02c1707dfd1868689554a005b577ec942476d2844c84','Trần Kỹ Thuật',NULL,'Xưởng sửa chữa đồng hồ',66,'ktv',1,'2026-09-14 07:23:18','2026-09-14 07:23:17','2026-09-14 07:23:18');
INSERT INTO "User" VALUES(28,'ketoan@sowasuco.vn','sha256:5c3e7465678751e7719e02c1707dfd1868689554a005b577ec942476d2844c84','Lê Thị Kế Toán',NULL,'Phòng Kế hoạch Tài chính',66,'accountant',1,'2026-09-14 07:23:18','2026-09-14 07:23:17','2026-09-14 07:23:18');
INSERT INTO "User" VALUES(29,'chinhanh.tp1@sowasuco.vn','sha256:5c3e7465678751e7719e02c1707dfd1868689554a005b577ec942476d2844c84','Lò Văn Nhánh',NULL,'Xí nghiệp Cấp nước TP 1',67,'unit_user',1,'2026-09-14 07:23:18','2026-09-14 07:23:17','2026-09-14 07:23:18');

INSERT INTO "Meter" VALUES(126,'ĐH015','Đồng hồ D15','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(127,'ĐH015(SC)','Đồng hồ sửa chữa 015','Sửa chữa',NULL,'Cái',NULL,NULL,120000.0,80000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(128,'ĐH015(SC)-DV','Đồng hồ sửa chữa 015 đơn vị','Sửa chữa',NULL,'Cái',NULL,NULL,120000.0,80000.0,0,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(129,'ĐH015-TAC','Đồng hồ Thái Aichi MAM-15 ( không kèm rắc co)','Ngoại nhập',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(130,'ĐH025','Đồng hồ D25','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(131,'ĐH025(SC)','Đồng hồ D25 (sửa chữa)','Sửa chữa',NULL,'Cái',NULL,NULL,120000.0,80000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(132,'ĐH032','Đồng hồ D32','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(133,'ĐH032(SC)','Đồng hồ D32 (sửa chữa)','Sửa chữa',NULL,'Cái',NULL,NULL,120000.0,80000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(134,'ĐH040','Đồng hồ D40','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(135,'ĐH040(SC)','Đồng hồ D40 (sửa chữa)','Sửa chữa',NULL,'Cái',NULL,NULL,120000.0,80000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(136,'ĐH040-ĐLL','Đồng hồ đo lưu lượng Turbobar hiệu Bermad DN40','Ngoại nhập',NULL,'Bộ',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(137,'ĐH050','Đồng hồ D50','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(138,'ĐH050(SC)','Đồng hồ D50 (sửa chữa)','Sửa chữa',NULL,'Cái',NULL,NULL,120000.0,80000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(139,'ĐH050-BM','Đồng hồ DN50 hiệu Bermad','Ngoại nhập',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(140,'ĐH065','Đồng hồ D65','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(141,'ĐH065-ĐLL','Đồng hồ đo lưu lượng Turbobar hiệu Bermad DN65','Ngoại nhập',NULL,'Bộ',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(142,'ĐH080','Đồng hồ D80','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(143,'ĐH100','Đồng hồ D100','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(144,'ĐH150','Đồng hồ nước DN150 CONTOR-Metcon','Ngoại nhập',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(145,'ĐH150-CTOR','Đồng hồ nước DN150 CONTOR-Metcon','Ngoại nhập',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(146,'ĐH200','Đồng hồ D200','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(147,'ĐH15','Đồng hồ D15 metcon','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(148,'D25FLD','Đồng hồ D25 Flodis','Ngoại nhập',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(149,'D32FLD','Đồng hồ D32 Flodis','Ngoại nhập',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Meter" VALUES(150,'D40FLT','Đồng hồ D40 Flostar','Tiêu chuẩn',NULL,'Cái',NULL,NULL,350000.0,250000.0,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');

INSERT INTO "SparePart" VALUES(176,'VP-D15-001','Nắp đồng hồ D15','Nắp',NULL,'Cái',14300.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(177,'VP-D15-002','Chụp xoay đồng hồ D15','Chụp',NULL,'Cái',22750.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(178,'VP-D15-003','Gioăng sắt','Gioăng',NULL,'Cái',0.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(179,'VP-D15-004','Mặt số đồng hồ D15','Mặt số',NULL,'Cái',179400.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(180,'VP-D15-005','Nắp chặn buồng đo D15','Nắp',NULL,'Cái',32500.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(181,'VP-D15-006','Cánh quạt đồng hồ D15','Cánh quạt',NULL,'Cái',52000.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(182,'VP-D15-007','Buồng đo đồng hồ D15','Buồng đo',NULL,'Cái',46800.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(183,'VP-D15-008','Bộ phận chỉnh bù lưu lượng đồng hồ D15 (vít tinh chỉnh)','Vít tinh chỉnh',NULL,'Cái',14300.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(184,'VP-D15-009','Gioăng nắp chặn buồng đo đồng hồ D15 (số 9)','Nắp',NULL,'Cái',14300.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(185,'VP-D15-010','Gioăng ốc chặn nút chỉnh đồng hồ D15 (số 14)','Gioăng',NULL,'Cái',4420.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(186,'VP-D15-011','Vành chống từ đồng hồ D15','Vành chống từ',NULL,'Cái',19500.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(187,'VP-D15-012','Gioăng cao su chặn buồng đo D15 (gioăng số 12)','Gioăng',NULL,'Cái',11700.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(188,'VP-D15-013','Ốc chặn MTM bộ phận chỉnh bù lưu lượng D15','Vít tinh chỉnh',NULL,'Cái',10660.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(189,'VP-014','Nắp đồng hồ to','Nắp',NULL,'Cái',21000.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(190,'VP-015','Chụp xoay đồng hồ to','Chụp',NULL,'Cái',83400.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(191,'VP-016','Mặt số D25-32','Mặt số',NULL,'Cái',659100.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(192,'VP-017','Mặt số D40-50','Mặt số',NULL,'Cái',791000.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(193,'VP-018','Cánh quạt D25,32','Cánh quạt',NULL,'Cái',197800.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(194,'VP-019','Cánh quạt D40,50','Cánh quạt',NULL,'Cái',347100.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(195,'VP-020','Buồng đo D25,32','Buồng đo',NULL,'Cái',131900.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(196,'VP-021','Buồng đo D40,50','Buồng đo',NULL,'Cái',462700.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(197,'VP-022','Chụp buồng đo D40,50','Chụp',NULL,'Cái',173700.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(198,'VP-023','Nắp chặn trên D40,50,25,32','Nắp',NULL,'Cái',173700.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(199,'VP-025','Vòng chặn D25,32','Linh kiện khác',NULL,'Cái',58500.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(200,'VP-026','Vành chống từ','Vành chống từ',NULL,'Cái',19500.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(201,'VP-027','gioăng số 7 D40,50,25,32','Gioăng',NULL,'Cái',14100.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(202,'VP-028','gioăng số 9 D40 nhỏ','Gioăng',NULL,'Cái',31200.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(203,'VP-029','gioăng số 12 D40','Gioăng',NULL,'Cái',46500.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(204,'VP-030','gioăng số 9 D40 to','Gioăng',NULL,'Cái',28300.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(205,'VP-031','gioăng số 11 D25','Gioăng',NULL,'Cái',7200.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(206,'VP-032','Vít tinh chỉnh D25,32','Vít tinh chỉnh',NULL,'Cái',21000.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(207,'VP-033','Vít tinh chỉnh D40,50','Vít tinh chỉnh',NULL,'Cái',21000.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(208,'VP-034','Lưới lọc 25,32','Linh kiện khác',NULL,'Cái',46500.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(209,'VP-035','Lưới lọc 40,50','Linh kiện khác',NULL,'Cái',86900.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "SparePart" VALUES(210,'VP-037','Vành Dưới Buồng đo D40-D50','Buồng đo',NULL,'Cái',0.0,20,1,NULL,'2026-09-14 07:23:17','2026-09-14 07:23:17');

INSERT INTO "MeterSparePart" VALUES(61,126,176,1,'2026-09-14 07:23:17');
INSERT INTO "MeterSparePart" VALUES(62,126,177,1,'2026-09-14 07:23:17');
INSERT INTO "MeterSparePart" VALUES(63,126,178,1,'2026-09-14 07:23:17');
INSERT INTO "MeterSparePart" VALUES(64,126,179,1,'2026-09-14 07:23:17');
INSERT INTO "MeterSparePart" VALUES(65,126,180,1,'2026-09-14 07:23:17');
INSERT INTO "MeterSparePart" VALUES(66,126,181,1,'2026-09-14 07:23:17');
INSERT INTO "MeterSparePart" VALUES(67,126,182,1,'2026-09-14 07:23:17');
INSERT INTO "MeterSparePart" VALUES(68,126,183,1,'2026-09-14 07:23:17');
INSERT INTO "MeterSparePart" VALUES(69,126,184,1,'2026-09-14 07:23:17');
INSERT INTO "MeterSparePart" VALUES(70,126,185,1,'2026-09-14 07:23:17');
INSERT INTO "MeterSparePart" VALUES(71,126,186,1,'2026-09-14 07:23:17');
INSERT INTO "MeterSparePart" VALUES(72,126,187,1,'2026-09-14 07:23:17');

INSERT INTO "Contract" VALUES(7,'HD-2026-LINHKIEN','Hợp đồng mua sắm vật tư linh kiện sửa chữa đồng hồ năm 2026','Công ty Cổ phần Thiết bị & Công nghệ Nước Sài Gòn','2026-01-05 00:00:00',350000000.0,'active','Hợp đồng mua theo nhiều đợt giao hàng trong năm 2026','2026-09-14 07:23:17','2026-09-14 07:23:17');

INSERT INTO "ContractBatch" VALUES(24,7,1,'Đợt 1 - Cung ứng Tháng 01/2026','2026-01-10 00:00:00','2026-01-12 00:00:00','completed','Đã nhập kho đủ theo phiếu giao nhận đợt 1','2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "ContractBatch" VALUES(25,7,2,'Đợt 2 - Cung ứng Tháng 05/2026','2026-05-15 00:00:00','2026-05-18 00:00:00','completed','Bổ sung linh kiện D15 đợt cao điểm','2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "ContractBatch" VALUES(26,7,3,'Đợt 3 - Cung ứng Tháng 06/2026','2026-06-10 00:00:00','2026-06-14 00:00:00','completed','Bổ sung chụp xoay và gioăng','2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "ContractBatch" VALUES(27,7,4,'Đợt 4 - Cung ứng Tháng 07/2026','2026-07-20 00:00:00','2026-07-22 00:00:00','completed','Đợt linh kiện định kỳ quý 3','2026-09-14 07:23:17','2026-09-14 07:23:17');

INSERT INTO "Inventory" VALUES(413,66,126,NULL,500,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(414,66,134,NULL,4,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(415,66,136,NULL,1,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(416,66,137,NULL,2,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(417,66,139,NULL,6,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(418,66,140,NULL,4,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(419,66,142,NULL,2,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(420,66,143,NULL,4,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(421,66,144,NULL,3,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(422,66,145,NULL,1,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(423,66,148,NULL,17,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(424,66,149,NULL,38,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(425,66,NULL,176,2510,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(426,66,NULL,177,2648,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(427,66,NULL,179,560,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(428,66,NULL,180,4905,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(429,66,NULL,181,3539,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(430,66,NULL,182,3208,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(431,66,NULL,183,2410,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(432,66,NULL,184,2490,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(433,66,NULL,185,1790,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(434,66,NULL,186,3799,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(435,66,NULL,187,2755,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(436,66,NULL,188,3210,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(437,66,NULL,191,25,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(438,66,NULL,192,87,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(439,66,NULL,193,11,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(440,66,NULL,195,10,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(441,66,NULL,196,70,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(442,66,NULL,197,88,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(443,66,NULL,201,39,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(444,66,NULL,202,30,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(445,66,NULL,203,108,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(446,66,NULL,204,89,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(447,66,NULL,205,67,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(448,66,NULL,206,16,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(449,66,NULL,207,24,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(450,66,NULL,208,29,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(451,66,NULL,209,21,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(452,67,126,NULL,45,'circulating','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(453,67,126,NULL,15,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(454,67,126,NULL,8,'sent_for_repair','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(455,68,126,NULL,45,'circulating','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(456,68,126,NULL,15,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(457,68,126,NULL,8,'sent_for_repair','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(458,69,126,NULL,45,'circulating','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(459,69,126,NULL,15,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(460,69,126,NULL,8,'sent_for_repair','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(461,70,126,NULL,45,'circulating','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(462,70,126,NULL,15,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(463,70,126,NULL,8,'sent_for_repair','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(464,71,126,NULL,45,'circulating','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(465,71,126,NULL,15,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(466,71,126,NULL,8,'sent_for_repair','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(467,72,126,NULL,45,'circulating','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(468,72,126,NULL,15,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(469,72,126,NULL,8,'sent_for_repair','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(470,73,126,NULL,45,'circulating','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(471,73,126,NULL,15,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(472,73,126,NULL,8,'sent_for_repair','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(473,74,126,NULL,45,'circulating','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(474,74,126,NULL,15,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(475,74,126,NULL,8,'sent_for_repair','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(476,75,126,NULL,45,'circulating','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(477,75,126,NULL,15,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(478,75,126,NULL,8,'sent_for_repair','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(479,76,126,NULL,45,'circulating','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(480,76,126,NULL,15,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(481,76,126,NULL,8,'sent_for_repair','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(482,77,126,NULL,45,'circulating','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(483,77,126,NULL,15,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(484,77,126,NULL,8,'sent_for_repair','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(485,78,126,NULL,45,'circulating','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(486,78,126,NULL,15,'new','2026-09-14 07:23:17');
INSERT INTO "Inventory" VALUES(487,78,126,NULL,8,'sent_for_repair','2026-09-14 07:23:17');

INSERT INTO "ImportVoucherDetail" VALUES(74,17,126,NULL,20,80000.0,1600000.0,'sent_for_repair','Đồng hồ cũ tháo gỡ chờ kiểm định & sửa chữa','2026-09-14 07:23:17');
INSERT INTO "ImportVoucherDetail" VALUES(75,17,130,NULL,5,120000.0,600000.0,'sent_for_repair','Đồng hồ DN25 cũ cần thay buồng đo','2026-09-14 07:23:17');
INSERT INTO "ImportVoucherDetail" VALUES(76,18,126,NULL,15,80000.0,1200000.0,'sent_for_repair','Đồng hồ cũ tháo gỡ chờ kiểm định & sửa chữa','2026-09-14 07:23:17');
INSERT INTO "ImportVoucherDetail" VALUES(77,19,126,NULL,12,80000.0,960000.0,'sent_for_repair','Đồng hồ cũ tháo gỡ chờ kiểm định & sửa chữa','2026-09-14 07:23:17');
INSERT INTO "ImportVoucherDetail" VALUES(78,19,130,NULL,3,120000.0,360000.0,'sent_for_repair','Đồng hồ DN25 cũ cần thay buồng đo','2026-09-14 07:23:17');
INSERT INTO "ImportVoucherDetail" VALUES(79,20,126,NULL,18,80000.0,1440000.0,'sent_for_repair','Đồng hồ cũ tháo gỡ chờ kiểm định & sửa chữa','2026-09-14 07:23:17');
INSERT INTO "ImportVoucherDetail" VALUES(80,20,130,NULL,4,120000.0,480000.0,'sent_for_repair','Đồng hồ DN25 cũ cần thay buồng đo','2026-09-14 07:23:17');
INSERT INTO "ImportVoucherDetail" VALUES(81,21,126,NULL,10,80000.0,800000.0,'sent_for_repair','Đồng hồ cũ tháo gỡ chờ kiểm định & sửa chữa','2026-09-14 07:23:17');
INSERT INTO "ImportVoucherDetail" VALUES(82,22,126,NULL,8,80000.0,640000.0,'sent_for_repair','Đồng hồ cũ tháo gỡ chờ kiểm định & sửa chữa','2026-09-14 07:23:17');
INSERT INTO "ImportVoucherDetail" VALUES(83,22,130,NULL,2,120000.0,240000.0,'sent_for_repair','Đồng hồ DN25 cũ cần thay buồng đo','2026-09-14 07:23:17');
INSERT INTO "ImportVoucherDetail" VALUES(84,23,NULL,176,500,14300.0,7150000.0,'new','Nắp D15 mới','2026-09-14 07:23:17');
INSERT INTO "ImportVoucherDetail" VALUES(85,23,NULL,177,400,22750.0,9100000.0,'new','Chụp xoay D15 mới','2026-09-14 07:23:17');
INSERT INTO "ImportVoucherDetail" VALUES(86,23,NULL,178,300,48000.0,14400000.0,'new','Mặt số D15 mới','2026-09-14 07:23:17');

INSERT INTO "ExportVoucher" VALUES(14,'PXK-2026-0001','2026-02-20 00:00:00','unit_distribution',66,67,25,'completed',2160000.0,'Xuất cấp trả 18 đồng hồ D15 quay vòng sau sửa chữa cho TP1','2026-09-14 07:23:17','2026-09-14 07:23:17','Nguyễn Văn Tiến','Đại diện nhận hàng chi nhánh');
INSERT INTO "ExportVoucher" VALUES(15,'PXK-2026-0002','2026-03-02 00:00:00','unit_distribution',66,68,25,'completed',1800000.0,'Xuất cấp 15 đồng hồ D15 quay vòng phục vụ thay thế khách hàng','2026-09-14 07:23:17','2026-09-14 07:23:17','Nguyễn Văn Tiến','Đại diện nhận hàng chi nhánh');
INSERT INTO "ExportVoucher" VALUES(16,'PXK-2026-0003','2026-03-12 00:00:00','unit_distribution',66,69,25,'completed',1200000.0,'Cấp phát 10 đồng hồ D15 theo kế hoạch quý 1','2026-09-14 07:23:17','2026-09-14 07:23:17','Nguyễn Văn Tiến','Đại diện nhận hàng chi nhánh');
INSERT INTO "ExportVoucher" VALUES(17,'PXK-2026-0004','2026-03-25 00:00:00','unit_distribution',66,70,25,'completed',1440000.0,'Cấp phát đồng hồ thay thế định kỳ cho CNCN Mộc Châu','2026-09-14 07:23:17','2026-09-14 07:23:17','Nguyễn Văn Tiến','Đại diện nhận hàng chi nhánh');
INSERT INTO "ExportVoucher" VALUES(18,'PXK-2026-0005','2026-04-10 00:00:00','unit_distribution',66,71,25,'completed',1200000.0,'Xuất kho đồng hồ quay vòng cho CNCN Yên Châu','2026-09-14 07:23:17','2026-09-14 07:23:17','Nguyễn Văn Tiến','Đại diện nhận hàng chi nhánh');
INSERT INTO "ExportVoucher" VALUES(19,'PXK-2026-0006','2026-04-18 00:00:00','unit_distribution',66,74,25,'completed',960000.0,'Xuất cấp phát đồng hồ cho CNCN Sông Mã','2026-09-14 07:23:17','2026-09-14 07:23:17','Nguyễn Văn Tiến','Đại diện nhận hàng chi nhánh');

INSERT INTO "ExportVoucherDetail" VALUES(16,14,126,NULL,18,120000.0,2160000.0,'circulating','Đồng hồ quay vòng xưởng đã kiểm định đạt','2026-09-14 07:23:17');
INSERT INTO "ExportVoucherDetail" VALUES(17,15,126,NULL,15,120000.0,1800000.0,'circulating','Đồng hồ quay vòng xưởng đã kiểm định đạt','2026-09-14 07:23:17');
INSERT INTO "ExportVoucherDetail" VALUES(18,16,126,NULL,10,120000.0,1200000.0,'circulating','Đồng hồ quay vòng xưởng đã kiểm định đạt','2026-09-14 07:23:17');
INSERT INTO "ExportVoucherDetail" VALUES(19,17,126,NULL,12,120000.0,1440000.0,'circulating','Đồng hồ quay vòng xưởng đã kiểm định đạt','2026-09-14 07:23:17');
INSERT INTO "ExportVoucherDetail" VALUES(20,18,126,NULL,10,120000.0,1200000.0,'circulating','Đồng hồ quay vòng xưởng đã kiểm định đạt','2026-09-14 07:23:17');
INSERT INTO "ExportVoucherDetail" VALUES(21,19,126,NULL,8,120000.0,960000.0,'circulating','Đồng hồ quay vòng xưởng đã kiểm định đạt','2026-09-14 07:23:17');



INSERT INTO "RepairVoucher" VALUES(19,'PSC-2026-0001','2026-02-15 00:00:00',66,126,20,18,2,23,27,'completed','Bảo dưỡng sửa chữa đồng hồ D15 đợt 1','2026-09-14 07:23:17','2026-09-14 07:23:17',NULL,NULL);
INSERT INTO "RepairVoucher" VALUES(20,'PSC-2026-0002','2026-02-28 00:00:00',66,126,15,15,0,23,27,'completed','Thay thế buồng đo và gioăng mặt số D15','2026-09-14 07:23:17','2026-09-14 07:23:17',NULL,NULL);
INSERT INTO "RepairVoucher" VALUES(21,'PSC-2026-0003','2026-03-10 00:00:00',66,130,10,9,1,23,27,'completed','Sửa chữa đồng hồ D25 chi nhánh Mộc Châu gửi','2026-09-14 07:23:17','2026-09-14 07:23:17',NULL,NULL);
INSERT INTO "RepairVoucher" VALUES(22,'PSC-2026-0004','2026-03-20 00:00:00',66,126,12,12,0,23,27,'completed','Vệ sinh, căn chỉnh vít bù lưu lượng và hiệu chuẩn','2026-09-14 07:23:17','2026-09-14 07:23:17',NULL,NULL);
INSERT INTO "RepairVoucher" VALUES(23,'PSC-2026-0005','2026-04-05 00:00:00',66,126,16,15,1,23,27,'completed','Hoàn tất sửa chữa lô ĐH cũ Yên Châu và Mai Sơn','2026-09-14 07:23:17','2026-09-14 07:23:17',NULL,NULL);

INSERT INTO "RepairVoucherSparePart" VALUES(56,19,176,18,14300.0,'2026-09-14 07:23:17');
INSERT INTO "RepairVoucherSparePart" VALUES(57,19,177,18,22750.0,'2026-09-14 07:23:17');
INSERT INTO "RepairVoucherSparePart" VALUES(58,20,176,15,14300.0,'2026-09-14 07:23:17');
INSERT INTO "RepairVoucherSparePart" VALUES(59,20,177,15,22750.0,'2026-09-14 07:23:17');
INSERT INTO "RepairVoucherSparePart" VALUES(60,21,176,9,14300.0,'2026-09-14 07:23:17');
INSERT INTO "RepairVoucherSparePart" VALUES(61,21,177,9,22750.0,'2026-09-14 07:23:17');
INSERT INTO "RepairVoucherSparePart" VALUES(62,22,176,12,14300.0,'2026-09-14 07:23:17');
INSERT INTO "RepairVoucherSparePart" VALUES(63,22,177,12,22750.0,'2026-09-14 07:23:17');
INSERT INTO "RepairVoucherSparePart" VALUES(64,23,176,15,14300.0,'2026-09-14 07:23:17');
INSERT INTO "RepairVoucherSparePart" VALUES(65,23,177,15,22750.0,'2026-09-14 07:23:17');



INSERT INTO "Alert" VALUES(11,66,NULL,NULL,'low_stock','Mặt số đồng hồ D15 (VP-004) tồn kho chỉ còn 560 cái, sắp chạm mức cảnh báo.',0,NULL,'2026-09-14 07:23:17');
INSERT INTO "Alert" VALUES(12,66,NULL,NULL,'low_stock','Đồng hồ D40 tồn kho hiện tại chỉ còn 4 cái.',0,NULL,'2026-09-14 07:23:17');

INSERT INTO "Employee" VALUES(1,'Nguyễn Văn Tiến','NVX-Số 02 ngõ 69 Tổ 8 Phường Chiềng Lề, TP Sơn La, tỉnh Sơn La','',NULL,'Xưởng đồng hồ','Thủ kho',1,'','2026-09-11 01:48:56','2026-09-11 08:38:12');
INSERT INTO "Employee" VALUES(2,'Bùi Đức Duy','ĐTX-01','0',NULL,'Xưởng đồng hồ','Đội trưởng',1,'','2026-09-11 01:48:56','2026-09-11 03:32:57');
INSERT INTO "Employee" VALUES(4,'Nguyễn Việt Hồng','NV-XNCN-TP01-01','',NULL,'XNCN Số 1','Giám đốc',1,'','2026-09-11 01:48:56','2026-09-11 08:34:30');
INSERT INTO "Employee" VALUES(6,'Nguyễn Ngọc Thạch','NV-XNCN-TP02-01','',NULL,'XNCN Số 2','Giám đốc',1,'','2026-09-11 01:48:56','2026-09-11 08:35:09');
INSERT INTO "Employee" VALUES(8,'Hồ Thành Trung','NV-XNCN-MS-01','',NULL,'Xí Nghiệp Mai Sơn','Giám đốc',1,'','2026-09-11 01:48:56','2026-09-11 03:34:18');
INSERT INTO "Employee" VALUES(10,'Phạm Minh Đức','NV-CNCN-MC-01','',NULL,'CNCN Mộc Châu','Giám đốc',1,'','2026-09-11 01:48:56','2026-09-11 08:31:08');
INSERT INTO "Employee" VALUES(12,'Trịnh Văn Hồng','NV-CNCN-YC-01','',NULL,'CNCN Yên Châu','Giám đốc',1,'','2026-09-11 01:48:56','2026-09-11 08:36:16');
INSERT INTO "Employee" VALUES(14,'Nguyễn Bá Bảo','NV-CNCN-BY-01','',NULL,'CNCN Bắc Yên','Giám đốc',1,'','2026-09-11 01:48:56','2026-09-11 03:33:43');
INSERT INTO "Employee" VALUES(15,'Nguyễn Bá Bảo','NV-CNCN-BY-02','',NULL,'CNCN Bắc Yên','Giám đốc',1,'','2026-09-11 01:48:56','2026-09-11 08:36:50');
INSERT INTO "Employee" VALUES(16,'Vũ Ngọc Tuấn','NV-CNCN-TC-01','',NULL,'CNCN Thuận Châu','Giám đốc',1,'','2026-09-11 01:48:56','2026-09-11 08:35:32');
INSERT INTO "Employee" VALUES(18,'Ngô Thế Nghĩa','NV-CNCN-PY-01','',NULL,'CNCN Phù Yên','Giám đốc',1,'','2026-09-11 01:48:56','2026-09-11 08:31:38');
INSERT INTO "Employee" VALUES(20,'Ngô Xuân Ngọc','NV-CNCN-ML-01','',NULL,'CNCN Mường La','Giám đốc',1,'','2026-09-11 01:48:56','2026-09-11 08:30:46');
INSERT INTO "Employee" VALUES(22,'Nguyễn Văn Sơn','NV-CNCN-SM-01','',NULL,'CNCN Sông Mã','Giám đốc',1,'','2026-09-11 01:48:56','2026-09-11 08:32:55');
INSERT INTO "Employee" VALUES(24,'Đoàn Quang Việt','NV-CN-SC-01','',NULL,'CNCN Sốp Cộp','Giám đốc',1,'','2026-09-11 01:48:56','2026-09-11 08:33:32');
INSERT INTO "Employee" VALUES(26,'Trần Xuân Long','NV-CNCN-QN-01','',NULL,'CNCN Quỳnh Nhai','Giám đốc',1,'','2026-09-11 01:48:56','2026-09-11 08:32:00');
INSERT INTO "Employee" VALUES(28,'Lương Phương Thảo','NV-LPT',NULL,NULL,'Xưởng đồng hồ','Cán bộ lập phiếu',1,NULL,'2026-09-11 04:04:09','2026-09-11 04:04:09');

INSERT INTO "ImportVoucher" VALUES(17,'PNK-2026-TH-001','2026-02-08 00:00:00','old_meters_return',NULL,NULL,66,67,'Cán bộ kỹ thuật chi nhánh','Nguyễn Văn Tiến',25,'completed',2000000.0,'Tiếp nhận đồng hồ tháo gỡ cũ từ đơn vị XNCN-TP01 về xưởng bảo dưỡng, sửa chữa quay vòng','2026-09-14 07:23:17','2026-09-14 07:23:17','Phòng Quản lý Khách hàng','Trần Kỹ Thuật');
INSERT INTO "ImportVoucher" VALUES(18,'PNK-2026-TH-002','2026-02-12 00:00:00','old_meters_return',NULL,NULL,66,68,'Cán bộ kỹ thuật chi nhánh','Nguyễn Văn Tiến',25,'completed',1200000.0,'Tiếp nhận đồng hồ tháo gỡ cũ từ đơn vị XNCN-TP02 về xưởng bảo dưỡng, sửa chữa quay vòng','2026-09-14 07:23:17','2026-09-14 07:23:17','Phòng Quản lý Khách hàng','Trần Kỹ Thuật');
INSERT INTO "ImportVoucher" VALUES(19,'PNK-2026-TH-003','2026-02-25 00:00:00','old_meters_return',NULL,NULL,66,69,'Cán bộ kỹ thuật chi nhánh','Nguyễn Văn Tiến',25,'completed',1200000.0,'Tiếp nhận đồng hồ tháo gỡ cũ từ đơn vị XNCN-MS về xưởng bảo dưỡng, sửa chữa quay vòng','2026-09-14 07:23:17','2026-09-14 07:23:17','Phòng Quản lý Khách hàng','Trần Kỹ Thuật');
INSERT INTO "ImportVoucher" VALUES(20,'PNK-2026-TH-004','2026-03-05 00:00:00','old_meters_return',NULL,NULL,66,70,'Cán bộ kỹ thuật chi nhánh','Nguyễn Văn Tiến',25,'completed',1760000.0,'Tiếp nhận đồng hồ tháo gỡ cũ từ đơn vị CNCN-MC về xưởng bảo dưỡng, sửa chữa quay vòng','2026-09-14 07:23:17','2026-09-14 07:23:17','Phòng Quản lý Khách hàng','Trần Kỹ Thuật');
INSERT INTO "ImportVoucher" VALUES(21,'PNK-2026-TH-005','2026-03-15 00:00:00','old_meters_return',NULL,NULL,66,71,'Cán bộ kỹ thuật chi nhánh','Nguyễn Văn Tiến',25,'completed',800000.0,'Tiếp nhận đồng hồ tháo gỡ cũ từ đơn vị CNCN-YC về xưởng bảo dưỡng, sửa chữa quay vòng','2026-09-14 07:23:17','2026-09-14 07:23:17','Phòng Quản lý Khách hàng','Trần Kỹ Thuật');
INSERT INTO "ImportVoucher" VALUES(22,'PNK-2026-TH-006','2026-03-22 00:00:00','old_meters_return',NULL,NULL,66,74,'Cán bộ kỹ thuật chi nhánh','Nguyễn Văn Tiến',25,'completed',800000.0,'Tiếp nhận đồng hồ tháo gỡ cũ từ đơn vị CNCN-SM về xưởng bảo dưỡng, sửa chữa quay vòng','2026-09-14 07:23:17','2026-09-14 07:23:17','Phòng Quản lý Khách hàng','Trần Kỹ Thuật');
INSERT INTO "ImportVoucher" VALUES(23,'PNK-2026-HD001','2026-01-12 00:00:00','purchase_contract',7,24,66,NULL,'Đại diện Công ty CP Thiết bị Nước Sài Gòn','Nguyễn Văn Tiến',25,'completed',85000000.0,'Nhập kho đợt 1 linh kiện đồng hồ D15 theo hợp đồng HD-2026-LINHKIEN','2026-09-14 07:23:17','2026-09-14 07:23:17',NULL,'Trần Kỹ Thuật');

INSERT INTO "Unit" VALUES(66,'KHO-VP','Xưởng đồng hồ','Kho/Xưởng','Ngõ 43, Tổ 6 Chiềng Lề - Phường Tô Hiệu - Tỉnh Sơn La','0212.3852.xxx',NULL,0,1,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Unit" VALUES(67,'XNCN-TP01','XNCN TP số 1','Xí nghiệp','TP Sơn La','0212.3852.001',NULL,1,1,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Unit" VALUES(68,'XNCN-TP02','XNCN TP số 2','Xí nghiệp','TP Sơn La','0212.3852.002',NULL,2,1,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Unit" VALUES(69,'XNCN-MS','XNCN Mai Sơn','Xí nghiệp','Huyện Mai Sơn','0212.3843.003',NULL,3,1,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Unit" VALUES(70,'CNCN-MC','CNCN Mộc Châu','Chi nhánh','Huyện Mộc Châu','0212.3866.004',NULL,4,1,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Unit" VALUES(71,'CNCN-YC','CNCN Yên Châu','Chi nhánh','Huyện Yên Châu','0212.3840.005',NULL,5,1,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Unit" VALUES(72,'CNCN-PY','CNCN Phù Yên','Chi nhánh','Huyện Phù Yên','0212.3863.008',NULL,6,1,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Unit" VALUES(73,'CNCN-BY','CNCN Bắc Yên','Chi nhánh','Huyện Bắc Yên','0212.3860.006',NULL,7,1,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Unit" VALUES(74,'CNCN-SM','CNCN Sông Mã','Chi nhánh','Huyện Sông Mã','0212.3836.010',NULL,8,1,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Unit" VALUES(75,'CN-SC','CNCN Sốp Cộp','Chi nhánh','Huyện Sốp Cộp','0212.3877.011',NULL,9,1,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Unit" VALUES(76,'CNCN-TC','CNCN Thuận Châu','Chi nhánh','Huyện Thuận Châu','0212.3847.007',NULL,10,1,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Unit" VALUES(77,'CNCN-ML','CNCN Mường La','Chi nhánh','Huyện Mường La','0212.3851.009',NULL,11,1,'2026-09-14 07:23:17','2026-09-14 07:23:17');
INSERT INTO "Unit" VALUES(78,'CNCN-QN','CNCN Quỳnh Nhai','Chi nhánh','Huyện Quỳnh Nhai','0212.3872.012',NULL,12,1,'2026-09-14 07:23:17','2026-09-14 07:23:17');

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_unitId_idx" ON "User"("unitId");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE UNIQUE INDEX "Meter_code_key" ON "Meter"("code");
CREATE INDEX "Meter_category_idx" ON "Meter"("category");
CREATE INDEX "Meter_size_idx" ON "Meter"("size");
CREATE UNIQUE INDEX "SparePart_code_key" ON "SparePart"("code");
CREATE INDEX "SparePart_category_idx" ON "SparePart"("category");
CREATE INDEX "SparePart_size_idx" ON "SparePart"("size");
CREATE INDEX "MeterSparePart_meterId_idx" ON "MeterSparePart"("meterId");
CREATE INDEX "MeterSparePart_sparePartId_idx" ON "MeterSparePart"("sparePartId");
CREATE UNIQUE INDEX "MeterSparePart_meterId_sparePartId_key" ON "MeterSparePart"("meterId", "sparePartId");
CREATE UNIQUE INDEX "Contract_contractNumber_key" ON "Contract"("contractNumber");
CREATE INDEX "Contract_status_idx" ON "Contract"("status");
CREATE INDEX "Contract_contractNumber_idx" ON "Contract"("contractNumber");
CREATE INDEX "ContractBatch_contractId_idx" ON "ContractBatch"("contractId");
CREATE INDEX "ContractBatch_status_idx" ON "ContractBatch"("status");
CREATE UNIQUE INDEX "ContractBatch_contractId_batchNumber_key" ON "ContractBatch"("contractId", "batchNumber");
CREATE INDEX "Inventory_unitId_idx" ON "Inventory"("unitId");
CREATE INDEX "Inventory_meterId_idx" ON "Inventory"("meterId");
CREATE INDEX "Inventory_sparePartId_idx" ON "Inventory"("sparePartId");
CREATE INDEX "Inventory_status_idx" ON "Inventory"("status");
CREATE UNIQUE INDEX "Inventory_unitId_meterId_status_key" ON "Inventory"("unitId", "meterId", "status");
CREATE UNIQUE INDEX "Inventory_unitId_sparePartId_status_key" ON "Inventory"("unitId", "sparePartId", "status");
CREATE INDEX "ImportVoucherDetail_importVoucherId_idx" ON "ImportVoucherDetail"("importVoucherId");
CREATE INDEX "ImportVoucherDetail_meterId_idx" ON "ImportVoucherDetail"("meterId");
CREATE INDEX "ImportVoucherDetail_sparePartId_idx" ON "ImportVoucherDetail"("sparePartId");
CREATE UNIQUE INDEX "ExportVoucher_code_key" ON "ExportVoucher"("code");
CREATE INDEX "ExportVoucher_unitId_idx" ON "ExportVoucher"("unitId");
CREATE INDEX "ExportVoucher_destinationUnitId_idx" ON "ExportVoucher"("destinationUnitId");
CREATE INDEX "ExportVoucher_voucherDate_idx" ON "ExportVoucher"("voucherDate");
CREATE INDEX "ExportVoucher_status_idx" ON "ExportVoucher"("status");
CREATE INDEX "ExportVoucherDetail_exportVoucherId_idx" ON "ExportVoucherDetail"("exportVoucherId");
CREATE INDEX "ExportVoucherDetail_meterId_idx" ON "ExportVoucherDetail"("meterId");
CREATE INDEX "ExportVoucherDetail_sparePartId_idx" ON "ExportVoucherDetail"("sparePartId");
CREATE UNIQUE INDEX "TransferVoucher_code_key" ON "TransferVoucher"("code");
CREATE INDEX "TransferVoucher_fromUnitId_idx" ON "TransferVoucher"("fromUnitId");
CREATE INDEX "TransferVoucher_toUnitId_idx" ON "TransferVoucher"("toUnitId");
CREATE INDEX "TransferVoucher_voucherDate_idx" ON "TransferVoucher"("voucherDate");
CREATE INDEX "TransferVoucher_status_idx" ON "TransferVoucher"("status");
CREATE INDEX "TransferVoucherDetail_transferVoucherId_idx" ON "TransferVoucherDetail"("transferVoucherId");
CREATE INDEX "TransferVoucherDetail_meterId_idx" ON "TransferVoucherDetail"("meterId");
CREATE INDEX "TransferVoucherDetail_sparePartId_idx" ON "TransferVoucherDetail"("sparePartId");
CREATE UNIQUE INDEX "RepairVoucher_code_key" ON "RepairVoucher"("code");
CREATE INDEX "RepairVoucher_workshopUnitId_idx" ON "RepairVoucher"("workshopUnitId");
CREATE INDEX "RepairVoucher_meterId_idx" ON "RepairVoucher"("meterId");
CREATE INDEX "RepairVoucher_repairDate_idx" ON "RepairVoucher"("repairDate");
CREATE INDEX "RepairVoucher_status_idx" ON "RepairVoucher"("status");
CREATE INDEX "RepairVoucherSparePart_repairVoucherId_idx" ON "RepairVoucherSparePart"("repairVoucherId");
CREATE INDEX "RepairVoucherSparePart_sparePartId_idx" ON "RepairVoucherSparePart"("sparePartId");
CREATE UNIQUE INDEX "RepairVoucherSparePart_repairVoucherId_sparePartId_key" ON "RepairVoucherSparePart"("repairVoucherId", "sparePartId");
CREATE UNIQUE INDEX "MeterInspection_code_key" ON "MeterInspection"("code");
CREATE INDEX "MeterInspection_unitId_idx" ON "MeterInspection"("unitId");
CREATE INDEX "MeterInspection_meterId_idx" ON "MeterInspection"("meterId");
CREATE INDEX "MeterInspection_transferVoucherId_idx" ON "MeterInspection"("transferVoucherId");
CREATE INDEX "MeterInspection_inspectionDate_idx" ON "MeterInspection"("inspectionDate");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_tableName_recordId_idx" ON "AuditLog"("tableName", "recordId");
CREATE INDEX "AuditLog_changedAt_idx" ON "AuditLog"("changedAt");
CREATE INDEX "Alert_unitId_idx" ON "Alert"("unitId");
CREATE INDEX "Alert_meterId_idx" ON "Alert"("meterId");
CREATE INDEX "Alert_sparePartId_idx" ON "Alert"("sparePartId");
CREATE INDEX "Alert_isRead_idx" ON "Alert"("isRead");
CREATE UNIQUE INDEX "ImportVoucher_code_key" ON "ImportVoucher"("code");
CREATE INDEX "ImportVoucher_unitId_idx" ON "ImportVoucher"("unitId");
CREATE INDEX "ImportVoucher_sourceUnitId_idx" ON "ImportVoucher"("sourceUnitId");
CREATE INDEX "ImportVoucher_contractId_idx" ON "ImportVoucher"("contractId");
CREATE INDEX "ImportVoucher_contractBatchId_idx" ON "ImportVoucher"("contractBatchId");
CREATE INDEX "ImportVoucher_voucherDate_idx" ON "ImportVoucher"("voucherDate");
CREATE INDEX "ImportVoucher_status_idx" ON "ImportVoucher"("status");
CREATE INDEX "Employee_unitId_idx" ON "Employee"("unitId");
CREATE UNIQUE INDEX "Unit_code_key" ON "Unit"("code");
CREATE INDEX "Unit_code_idx" ON "Unit"("code");
CREATE INDEX "Unit_type_idx" ON "Unit"("type");
CREATE INDEX "Unit_sortOrder_idx" ON "Unit"("sortOrder");
