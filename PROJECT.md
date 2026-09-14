# Project: SOWASUCO Water Meter Management (SOWASUCO WM)

## Architecture
- **Framework**: Next.js 14/15 App Router (`src/app`), React 18, TypeScript 5, Tailwind CSS 3.4.
- **Database & ORM**: SQLite (`prisma/dev.db`) managed via Prisma ORM (`prisma/schema.prisma`).
  * SQLite WAL mode enabled for write concurrency.
  * Prisma client global singleton in `src/lib/prisma.ts`.
  * Status/enums represented as `String` in Prisma schema + strict TypeScript union types.
- **Service Layer**: Decoupled domain business services in `src/services/` (`inventory.service.ts`, `voucher.service.ts`, `repair.service.ts`, `report.service.ts`).
- **Excel Processing Engine**: `exceljs` (^4.4.0) for both parsing raw Excel workbooks during seeding and exporting styled reports with merged headers, borders, and embedded formulas.
- **Testing Architecture**: Vitest (`npm test`) for unit/integration suites and `scripts/verify-inventory.ts` (`npm run verify:inventory` via `tsx`) for standalone AC 5 inventory verification.

## Code Layout
```
QuanLyKho/
├── prisma/
│   ├── schema.prisma               # Prisma schema (16 entities for SQLite)
│   ├── dev.db                      # SQLite local database
│   └── migrations/                 # Migration records
├── public/                         # Brand assets, icons
├── scripts/
│   ├── seed.ts                     # Excel parsing & initial seeding script
│   └── verify-inventory.ts         # Standalone AC 5 inventory verification
├── src/
│   ├── app/                        # Next.js App Router pages & REST Route Handlers
│   │   ├── layout.tsx              # Root layout with Sidebar & Header
│   │   ├── page.tsx                # Dashboard with KPI cards & alerts
│   │   ├── login/page.tsx          # Authentication
│   │   ├── meters/page.tsx         # Meter catalog & unit stock
│   │   ├── spare-parts/page.tsx    # Spare parts catalog & min-stock alerts
│   │   ├── contracts/page.tsx      # Contracts & multi-batch imports (R1)
│   │   ├── vouchers/               # Vouchers: Import, Export, Transfer, Repair
│   │   │   ├── import/page.tsx
│   │   │   ├── export/page.tsx
│   │   │   ├── transfer/page.tsx
│   │   │   └── repair/page.tsx     # Workflow 1 repair & parts deduction
│   │   ├── units/page.tsx          # 12 Units inventory dashboard (R2)
│   │   ├── reports/                # Reports & Excel Export (R3)
│   │   │   ├── meters/page.tsx     # Nhập-Xuất-Tồn meters
│   │   │   └── spare-parts/page.tsx# Nhập-Sử dụng spare parts
│   │   └── api/                    # RESTful Route Handlers
│   │       ├── meters/route.ts
│   │       ├── spare-parts/route.ts
│   │       ├── contracts/route.ts
│   │       ├── vouchers/
│   │       │   ├── import/route.ts
│   │       │   ├── export/route.ts
│   │       │   ├── transfer/route.ts
│   │       │   └── repair/route.ts
│   │       ├── units/route.ts
│   │       ├── inventory/route.ts
│   │       └── reports/
│   │           ├── meters/route.ts
│   │           ├── spare-parts/route.ts
│   │           └── export/route.ts
│   ├── components/                 # Reusable UI & Layout Components
│   ├── lib/                        # Singletons (prisma.ts, excel.ts, inventory.ts, utils.ts)
│   ├── services/                   # Business Services
│   └── types/                      # TypeScript definitions & unions
├── tests/                          # Vitest test suites
│   ├── unit/
│   │   ├── inventory-balance.test.ts
│   │   └── stock-constraints.test.ts
│   └── integration/
│       └── voucher-transactions.test.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vitest.config.ts
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | F1. Next.js App Router Scaffold | Greenfield Next.js project with TypeScript, Tailwind CSS, Lucide icons, and layout structure | M1 | ORIGINAL_REQUEST R4, AC 1 |
| 2 | F2. Prisma SQLite Schema Design | 16 entities in `schema.prisma` covering units, users, meters, spare parts, BOM, contracts, batches, vouchers, inventory, inspections | M1 | sowasuco_wm_database.sql, Survey 1 |
| 3 | F3. Master Catalogs & Opening Balance Seeding | `npm run seed` parsing both Excel files: 12 units + Kho VP, 26 meters, 35 spare parts, opening stock, 2026 transactions | M1 | ORIGINAL_REQUEST R4, AC 1, Survey 2 |
| 4 | F4. Contracts & Multi-Batch Spare Parts Import | Procurement contract management with multi-batch receiving and inventory increment | M2 | ORIGINAL_REQUEST R1, AC 2 |
| 5 | F5. Workshop Repair Voucher & Spare Part Deduction | Repair order creation, BOM spare part auto-deduction, and over-export stock prevention | M2 | ORIGINAL_REQUEST R1, AC 2, AC 5 |
| 6 | F6. Repaired Meter Stock Replenishment | Intake completed repaired meters (`ĐH015(SC)`) into ready-to-circulate stock | M2 | ORIGINAL_REQUEST R1, AC 2 |
| 7 | F7. Inter-Unit Meter Dispatch Management | Dispatching new (100%) vs repaired meters to 12 units with real-time stock updates | M3 | ORIGINAL_REQUEST R2, AC 3 |
| 8 | F8. Unit Defective Meter Return & Inspection | Receiving meters from 12 units with inspection classification: Đạt, Cần sửa, Không đạt | M3 | ORIGINAL_REQUEST R2, AC 3 |
| 9 | F9. Real-Time Unit Inventory Dashboard | Multi-unit stock visibility filtered by meter type, spare parts, and 4 status tiers | M3 | ORIGINAL_REQUEST R2, AC 3 |
| 10| F10. Consolidated Nhập - Xuất - Tồn Meter Report | Monthly/yearly meter balance report matching Excel sheet `Báo cáo` (`Tồn cuối = Tồn đầu + Nhập - Xuất`) | M4 | ORIGINAL_REQUEST R3, AC 4 |
| 11| F11. Spare Parts Usage & Procurement Report | 12-month spare parts matrix matching sheet `Vật tư ` with procurement and consumption | M4 | ORIGINAL_REQUEST R3, AC 4 |
| 12| F12. Styled Native Excel (.xlsx) Export | Excel export using `exceljs` preserving 2-level headers, borders, colors, and formulas | M4 | ORIGINAL_REQUEST R3, AC 4 |
| 13| F13. Inventory Balance Automated Tests | Vitest suite verifying `Tồn cuối = Tồn đầu + Tổng Nhập - Tổng Xuất` across products | M5 | ORIGINAL_REQUEST R4, AC 5 |
| 14| F14. Stock Constraint Automated Tests | Vitest suite verifying spare parts cannot be exported/consumed in excess of stock | M5 | ORIGINAL_REQUEST R4, AC 5 |
| 15| F15. Standalone Inventory Verification Script | CLI script `npm run verify:inventory` checking database invariants and zero negative stock | M5 | ORIGINAL_REQUEST R4, AC 5 |
| 16| F16. End-to-End Suite Pass & Hardening | Full 100% E2E test pass (Tiers 1-4) & adversarial test hardening (Tier 5) | Final | Project Pattern Mandate |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Setup, Prisma Schema & Excel Seed Engine | F1, F2, F3: Project initialization, Prisma schema, migration, and `npm run seed` script | none | PLANNED |
| M2 | Workflow 1 - Workshop & Spare Parts Management | F4, F5, F6: Contracts, multi-batch imports, repair vouchers, spare parts auto-deduction, ready stock | M1 | PLANNED |
| M3 | Workflow 2 - Inter-Unit Transfer & Intake Management | F7, F8, F9: Meter dispatch (new vs repaired) to 12 units, returns intake, inspection classification, real-time inventory | M1 | PLANNED |
| M4 | Reporting & Native Excel Export | F10, F11, F12: Consolidated meter balance report, spare parts 12-month report, unit-level inventory, styled `.xlsx` export | M2, M3 | PLANNED |
| M5 | Automated Tests & Verification Script | F13, F14, F15: Vitest suites for balance logic, stock constraint checks, and standalone CLI script | M1, M2, M3, M4 | PLANNED |
| Final | E2E Test Suite Pass & Adversarial Hardening | F16: 100% E2E opaque-box test pass (Tiers 1-4) & Tier 5 adversarial hardening | M5, E2E Track | PLANNED |

## Interface Contracts
### Inventory Service Contract (`src/services/inventory.service.ts`)
- `calculateEndingBalance(opening: number, totalImport: number, totalExport: number): number`
  * Invariant: `ending = (opening + totalImport) - totalExport`. Throws if any input is negative.
- `validateExportStock(params: { availableStock: number, requestedQuantity: number }): { allowed: boolean, remainingStock: number, deficit?: number }`
  * Invariant: `requestedQuantity <= availableStock`. If false, returns `allowed: false`.
- `validateRepairBOM(meterId: number, quantity: number, unitId: number): Promise<{ canProceed: boolean, missingParts: Array<{ partId: number, required: number, available: number, deficit: number }> }>`
  * Invariant: All required spare parts for repairing `quantity` meters must be available in unit inventory.

### Voucher Service Contract (`src/services/voucher.service.ts`)
- `createImportVoucher(data: ImportVoucherInput): Promise<ImportVoucher>`
- `createExportVoucher(data: ExportVoucherInput): Promise<ExportVoucher>` (Atomic transaction: checks stock constraint before decrementing inventory)
- `createTransferVoucher(data: TransferVoucherInput): Promise<TransferVoucher>`
- `createRepairVoucher(data: RepairVoucherInput): Promise<RepairVoucher>` (Atomic transaction: deducts spare parts, increments repaired meter stock)

### Excel Service Contract (`src/lib/excel.ts`)
- `exportMeterBalanceReport(data: MeterReportData): Promise<Buffer>`
- `exportSparePartsReport(data: SparePartsReportData): Promise<Buffer>`
- Invariant: Returns styled workbook buffer with exact Vietnamese headers, borders, number formats (`#,##0`), and dynamic formulas.

## Auth & RBAC Subsystem Extension (Follow-up 2026-09-09)
### Feature Inventory (Auth & RBAC)
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 17| F17. Database Seed & Role Expansion | Expand UserRole in types, seed accountant & unit_user demo accounts in dev.db | M-Auth | ORIGINAL_REQUEST Follow-up R1, R2 |
| 18| F18. Web Crypto Stateless Session Engine | HMAC-SHA256 token in HTTP-only cookie (sowasuco_session) using Web Crypto API | M-Auth | ORIGINAL_REQUEST Follow-up R1 |
| 19| F19. Perimeter Middleware & Route Protection | Edge-compatible Next.js middleware guarding pages, redirecting unauthenticated to /login, /admin protection | M-Auth | ORIGINAL_REQUEST Follow-up R2 |
| 20| F20. Branded /login Page & 1-Click Demo Login | SOWASUCO branded login page with standard form and 5 demo 1-click login cards | M-Auth | ORIGINAL_REQUEST Follow-up R1 |
| 21| F21. Dynamic Role Navigation & Header Logout | Role-based menu filtering for 5 personas, active user badge (name, role, unit), and logout button | M-Auth | ORIGINAL_REQUEST Follow-up R1, R2 |
| 22| F22. Header Quick Role Switcher Dropdown | Header dropdown to switch active user role instantly for demo/testing | M-Auth | ORIGINAL_REQUEST Follow-up R3 |
| 23| F23. Voucher Deletion & Stock Revert Protection | Hide delete/edit buttons in UI for non-authorized roles; enforce requireAuth(['admin']) in Server Actions | M-Auth | ORIGINAL_REQUEST Follow-up R2 |
| 24| F24. Automated Auth & RBAC Test Suite | Vitest tests for session HMAC, role permission matrix, auth actions, and 100% build & existing test pass | M-Auth | ORIGINAL_REQUEST Follow-up AC 3 |

### Additional Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M-Auth | SOWASUCO WM Authentication, Session & RBAC Subsystem | F17 to F24: Seed data, session engine, middleware, login UI, dynamic navigation, role switcher, voucher guards, test suite | M1-M5 | IN_PROGRESS |
