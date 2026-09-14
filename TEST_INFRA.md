# E2E Test Infra: SOWASUCO Water Meter Management (SOWASUCO WM)

## Test Philosophy
- **Opaque-box, Requirement-driven**: All test scenarios are derived directly from `ORIGINAL_REQUEST.md` (R1-R4, Acceptance Criteria 1-5) and `sowasuco_wm_spec.md`, completely decoupled from implementation internals.
- **Methodology**: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Interaction Testing + Real-World Workload Testing.

## Feature Inventory & Test Matrix
| # | Feature | Requirement | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Real-World) |
|---|---------|-------------|:----------------:|:-----------------:|:-----------------:|:-------------------:|
| 1 | F1. Scaffold & Next.js Build | AC 1, R4 | 5 | 5 | ✓ | ✓ |
| 2 | F2. Prisma Schema Integrity | AC 1, R4 | 5 | 5 | ✓ | ✓ |
| 3 | F3. Excel Seeding (`npm run seed`) | AC 1, R4 | 5 | 5 | ✓ | ✓ |
| 4 | F4. Contract & Multi-Batch Procurement | AC 2, R1 | 5 | 5 | ✓ | ✓ |
| 5 | F5. Repair Voucher & Spare Part Deduction | AC 2, AC 5, R1 | 5 | 5 | ✓ | ✓ |
| 6 | F6. Repaired Meter Stock Intake | AC 2, R1 | 5 | 5 | ✓ | ✓ |
| 7 | F7. Meter Dispatch to 12 Units | AC 3, R2 | 5 | 5 | ✓ | ✓ |
| 8 | F8. Unit Defective Return & Inspection | AC 3, R2 | 5 | 5 | ✓ | ✓ |
| 9 | F9. Real-Time Unit Inventory Dashboard | AC 3, R2 | 5 | 5 | ✓ | ✓ |
| 10| F10. Consolidated Nhập-Xuất-Tồn Report | AC 4, R3 | 5 | 5 | ✓ | ✓ |
| 11| F11. Spare Parts Usage Report | AC 4, R3 | 5 | 5 | ✓ | ✓ |
| 12| F12. Styled Excel (.xlsx) Export | AC 4, R3 | 5 | 5 | ✓ | ✓ |
| 13| F13. Inventory Balance Formula Check | AC 5, R4 | 5 | 5 | ✓ | ✓ |
| 14| F14. Stock Constraint Enforcement | AC 5, R4 | 5 | 5 | ✓ | ✓ |
| 15| F15. Standalone Acceptance Verification | AC 5, R4 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Framework**: Vitest (`npm test`) for fast unit & integration tests, alongside `tsx scripts/verify-inventory.ts` (`npm run verify:inventory`) for acceptance verification.
- **Database Target**: Local SQLite test instance / `prisma/dev.db`.
- **Pass/Fail Semantics**: All test suites must complete with exit code 0. Zero test failures tolerated.
- **Directory Layout**:
  * `tests/unit/inventory-balance.test.ts`: Formula invariants `Ending = Opening + Import - Export`.
  * `tests/unit/stock-constraints.test.ts`: Over-export boundary prevention (`available >= requested`).
  * `tests/integration/voucher-transactions.test.ts`: Database transaction rollback on invalid operations.
  * `tests/e2e/`: Opaque-box full workflow test scripts.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity | Expected Outcome |
|---|----------|--------------------|------------|------------------|
| 1 | S1: Full Procurement to Workshop Repair Cycle | F4, F5, F6, F13, F14 | High | Multi-batch procurement of parts, repair of 50 D15 meters, exact deduction of BOM parts, increase of circulating meters |
| 2 | S2: Over-Export Protection & Transaction Rollback | F5, F14, F15 | Medium | Attempting to repair 10,000 meters when stock is insufficient is rejected with deficit details; stock remains intact |
| 3 | S3: 12 Units Meter Dispatch & Return Inspection | F7, F8, F9, F13 | High | Dispatch new + repaired meters to TP1 and Mai Sơn; return defective meters; inspection splits into Đạt, Cần sửa, Không đạt |
| 4 | S4: Annual Balance & Excel Export Audit | F10, F11, F12, F13 | High | Full 12-month balance matches Excel 2026 totals; downloaded `.xlsx` has valid formulas and correct data |
| 5 | S5: Database Seed Integrity & Consistency Audit | F1, F2, F3, F15 | Medium | Running `npm run seed` results in 12 units + Kho VP, 26 meters, 35 spare parts, exact opening stock balances |

## Coverage Thresholds
- Tier 1 (Feature Coverage): ≥ 5 tests per feature
- Tier 2 (Boundary & Corner Cases): ≥ 5 tests per feature
- Tier 3 (Cross-Feature Combinations): Pairwise interactions covered
- Tier 4 (Real-World Scenarios): ≥ 5 realistic application workflows
- Acceptance Criteria 5: Mandatory 100% pass for balance logic & stock constraints
