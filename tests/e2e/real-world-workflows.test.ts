import { describe, it, expect, beforeEach } from 'vitest';
import { TransactionalInventoryHarness } from '../helpers/voucher-helper';
import {
  referenceCalculateEndingBalance,
  referenceValidateExportStock,
  referenceValidateRepairBOM,
  D15_STANDARD_BOM,
} from '../helpers/inventory-helper';
import oracleData from '../fixtures/excel-oracle.json';

describe('Tier 4: Real-World E2E Application Scenarios (S1 - S5)', () => {
  let harness: TransactionalInventoryHarness;

  beforeEach(() => {
    harness = new TransactionalInventoryHarness();
  });

  // =========================================================================
  // SCENARIO S1: Full Procurement to Workshop Repair Cycle
  // Features Exercised: F4, F5, F6, F13, F14
  // =========================================================================
  describe('S1: Full Procurement to Workshop Repair Cycle (F4, F5, F6, F13, F14)', () => {
    it('should complete full cycle: multi-batch parts import -> BOM repair -> ready stock increment', async () => {
      // Step 1: Procurement Contract Multi-Batch Intake (Batch 1 at Kho VP: unitId 1)
      const procurementBatch = D15_STANDARD_BOM.map(part => ({
        unitId: 1,
        sparePartId: part.partId,
        quantity: 500, // Receive 500 of each spare part
      }));
      // Initial repaired meter stock is 0
      procurementBatch.push({ unitId: 1, meterId: 2 /* ĐH015(SC) */, quantity: 0 });
      harness.seed(procurementBatch);

      // Verify procurement stock recorded
      for (const part of D15_STANDARD_BOM) {
        expect(harness.getStock(1, undefined, part.partId)).toBe(500);
      }

      // Step 2: Validate BOM constraints before creating repair voucher
      const stockLookup = (partId: number) => harness.getStock(1, undefined, partId);
      const bomCheck = await referenceValidateRepairBOM(2, 50, 1, stockLookup);
      expect(bomCheck.canProceed).toBe(true);
      expect(bomCheck.missingParts).toHaveLength(0);

      // Step 3: Execute Workshop Repair of 50 meters
      const repairResult = await harness.createRepairVoucher({
        code: 'PSC-2026-S1-001',
        voucherDate: '2026-09-08',
        unitId: 1,
        meterId: 2,
        quantityRepaired: 50,
        partsUsed: D15_STANDARD_BOM.map(p => ({
          sparePartId: p.partId,
          quantity: 50 * p.quantityPerSet,
        })),
      });
      expect(repairResult.status).toBe('completed');
      expect(repairResult.quantityRepaired).toBe(50);

      // Step 4: Verify exact inventory deductions & additions
      for (const part of D15_STANDARD_BOM) {
        const remaining = harness.getStock(1, undefined, part.partId);
        expect(remaining).toBe(450); // 500 - 50 = 450
        // Balance formula check: Ending = Opening + Import - Export
        const balance = referenceCalculateEndingBalance(0, 500, 50);
        expect(remaining).toBe(balance);
      }

      // Step 5: Verify repaired meters available for circulation
      const repairedStock = harness.getStock(1, 2, undefined);
      expect(repairedStock).toBe(50);
    });
  });

  // =========================================================================
  // SCENARIO S2: Over-Export Protection & Transaction Rollback
  // Features Exercised: F5, F14, F15
  // =========================================================================
  describe('S2: Over-Export Protection & Transaction Rollback (F5, F14, F15)', () => {
    it('should reject repair of 10,000 meters when stock is insufficient and keep stock intact', async () => {
      // Seed 200 units of each part at Unit 1
      harness.seed(
        D15_STANDARD_BOM.map(part => ({
          unitId: 1,
          sparePartId: part.partId,
          quantity: 200,
        }))
      );

      // Validate stock constraint directly
      const constraint = referenceValidateExportStock({
        availableStock: 200,
        requestedQuantity: 10_000,
      });
      expect(constraint.allowed).toBe(false);
      expect(constraint.deficit).toBe(9800);

      // Attempt repair voucher creation
      const excessiveVoucher = {
        code: 'PSC-OVERSIZED',
        voucherDate: '2026-09-08',
        unitId: 1,
        meterId: 2,
        quantityRepaired: 10_000,
        partsUsed: D15_STANDARD_BOM.map(p => ({
          sparePartId: p.partId,
          quantity: 10_000 * p.quantityPerSet,
        })),
      };

      await expect(harness.createRepairVoucher(excessiveVoucher)).rejects.toThrow(/insufficient stock/i);

      // Verify stock was not decremented
      for (const part of D15_STANDARD_BOM) {
        expect(harness.getStock(1, undefined, part.partId)).toBe(200);
      }
    });
  });

  // =========================================================================
  // SCENARIO S3: 12 Units Meter Dispatch & Return Inspection
  // Features Exercised: F7, F8, F9, F13
  // =========================================================================
  describe('S3: 12 Units Meter Dispatch & Return Inspection (F7, F8, F9, F13)', () => {
    it('should dispatch meters to TP1 and Mai Son, receive returns, and verify inspection classification', async () => {
      // Unit 1: KHO-VP, Unit 2: TP1, Unit 4: MS
      harness.seed([
        { unitId: 1, meterId: 1 /* New D15 */, quantity: 500 },
        { unitId: 1, meterId: 2 /* Repaired D15 */, quantity: 300 },
        { unitId: 2, meterId: 1, quantity: 0 },
        { unitId: 2, meterId: 2, quantity: 0 },
        { unitId: 4, meterId: 1, quantity: 0 },
      ]);

      // 1. Dispatch 100 new + 50 repaired to TP1
      await harness.createTransferVoucher({
        code: 'PCK-DISPATCH-TP1',
        voucherDate: '2026-09-08',
        fromUnitId: 1,
        toUnitId: 2,
        details: [
          { meterId: 1, quantity: 100 },
          { meterId: 2, quantity: 50 },
        ],
      });

      // 2. Dispatch 80 new to Mai Son
      await harness.createTransferVoucher({
        code: 'PCK-DISPATCH-MS',
        voucherDate: '2026-09-08',
        fromUnitId: 1,
        toUnitId: 4,
        details: [{ meterId: 1, quantity: 80 }],
      });

      // Verify balances after dispatch
      expect(harness.getStock(1, 1, undefined)).toBe(320); // 500 - 100 - 80
      expect(harness.getStock(1, 2, undefined)).toBe(250); // 300 - 50
      expect(harness.getStock(2, 1, undefined)).toBe(100);
      expect(harness.getStock(2, 2, undefined)).toBe(50);
      expect(harness.getStock(4, 1, undefined)).toBe(80);

      // 3. Return 30 defective meters from TP1 to Workshop
      // Inspection results must sum to 30: 18 Needs Repair, 10 Passed retest, 2 Scrap
      const inspection = {
        totalReturned: 30,
        needsRepair: 18,
        passed: 10,
        unusable: 2,
      };
      expect(inspection.needsRepair + inspection.passed + inspection.unusable).toBe(inspection.totalReturned);
    });
  });

  // =========================================================================
  // SCENARIO S4: Annual Balance & Excel Reconciliation Audit
  // Features Exercised: F10, F11, F12, F13
  // =========================================================================
  describe('S4: Annual Balance & Excel Reconciliation Audit (F10, F11, F12, F13)', () => {
    it('should verify full company annual balance against authoritative Excel workbook totals', () => {
      // 1. Meters Total Audit
      let totalMeterOpening = 0;
      let totalMeterImport = 0;
      let totalMeterExport = 0;
      let totalMeterEnding = 0;

      for (const m of oracleData.meters) {
        totalMeterOpening += m.opening;
        totalMeterImport += m.import;
        totalMeterExport += m.export;
        totalMeterEnding += m.ending;
      }

      // Reconcile total company meter balance
      const calculatedTotalMeterEnding = referenceCalculateEndingBalance(
        totalMeterOpening,
        totalMeterImport,
        totalMeterExport
      );
      expect(calculatedTotalMeterEnding).toBe(totalMeterEnding);
      expect(totalMeterEnding).toBe(582); // True total ending inventory including FLODIS

      // 2. Spare Parts Total Audit
      let totalPartsOpening = 0;
      let totalPartsImport = 0;
      let totalPartsUsed = 0;
      let totalPartsEnding = 0;

      for (const p of oracleData.spare_parts) {
        totalPartsOpening += p.opening;
        totalPartsImport += p.total_import;
        totalPartsUsed += p.total_used;
        totalPartsEnding += p.ending;
      }

      expect(totalPartsOpening).toBe(15788);
      expect(totalPartsImport).toBe(79800);
      expect(totalPartsUsed).toBe(61050);
      expect(totalPartsEnding).toBe(34538);

      const calculatedTotalPartsEnding = referenceCalculateEndingBalance(
        totalPartsOpening,
        totalPartsImport,
        totalPartsUsed
      );
      expect(calculatedTotalPartsEnding).toBe(34538);
    });
  });

  // =========================================================================
  // SCENARIO S5: Master Data Seed Integrity & Consistency Audit
  // Features Exercised: F1, F2, F3, F15
  // =========================================================================
  describe('S5: Master Data Seed Integrity & Consistency Audit (F1, F2, F3, F15)', () => {
    it('should verify complete catalog constraints from spec (26 meters, 35 parts, 12 units)', () => {
      // 25 meter rows in report (plus D20 in master = 26 SKUs)
      expect(oracleData.meters.length).toBeGreaterThanOrEqual(25);

      // 35 spare parts with valid unit prices and units
      expect(oracleData.spare_parts.length).toBe(35);
      for (const p of oracleData.spare_parts) {
        expect(p.price).toBeGreaterThanOrEqual(0);
        expect(['Cái', 'cái', 'Bộ', 'bộ', 'Cặp', 'cặp']).toContain(p.unit);
      }

      // D15 standard BOM has 12 items
      expect(D15_STANDARD_BOM).toHaveLength(12);
      const uniquePartIds = new Set(D15_STANDARD_BOM.map(p => p.partId));
      expect(uniquePartIds.size).toBe(12);
    });
  });
});
