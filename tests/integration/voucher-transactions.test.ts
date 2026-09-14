import { describe, it, expect, beforeEach } from 'vitest';
import {
  TransactionalInventoryHarness,
  ExportVoucherInput,
  RepairVoucherInput,
  TransferVoucherInput,
} from '../helpers/voucher-helper';
import { D15_STANDARD_BOM } from '../helpers/inventory-helper';

describe('F15 & S2: Voucher Transaction Atomicity & Rollback Integration Tests', () => {
  let harness: TransactionalInventoryHarness;

  beforeEach(() => {
    harness = new TransactionalInventoryHarness();
  });

  // =========================================================================
  // TIER 1 & S2: Multi-Item Export Voucher Atomic Rollback
  // =========================================================================
  describe('Scenario S2: Multi-Item Export Transaction Rollback on Partial Failure', () => {
    it('should successfully commit export when all lines have sufficient stock', async () => {
      // Seed inventory: Meter 1 = 100, Meter 2 = 50 at Unit 1
      harness.seed([
        { unitId: 1, meterId: 1, quantity: 100 },
        { unitId: 1, meterId: 2, quantity: 50 },
      ]);

      const voucher: ExportVoucherInput = {
        code: 'PXK-TEST-001',
        voucherDate: '2026-09-08',
        unitId: 1,
        exportReason: 'sale',
        details: [
          { meterId: 1, quantity: 30 },
          { meterId: 2, quantity: 20 },
        ],
      };

      const result = await harness.createExportVoucher(voucher);
      expect(result.status).toBe('confirmed');

      // Verify stock was updated
      expect(harness.getStock(1, 1, undefined)).toBe(70);
      expect(harness.getStock(1, 2, undefined)).toBe(30);
    });

    it('should ROLLBACK completely when line 2 exceeds stock, leaving line 1 untouched', async () => {
      // Seed inventory: Meter 1 = 100, Meter 2 = 10 at Unit 1
      harness.seed([
        { unitId: 1, meterId: 1, quantity: 100 },
        { unitId: 1, meterId: 2, quantity: 10 },
      ]);

      const voucher: ExportVoucherInput = {
        code: 'PXK-TEST-OVEREXPORT',
        voucherDate: '2026-09-08',
        unitId: 1,
        exportReason: 'sale',
        details: [
          { meterId: 1, quantity: 40 }, // Sufficient (40 <= 100)
          { meterId: 2, quantity: 50 }, // INSUFFICIENT (50 > 10, deficit = 40)
        ],
      };

      await expect(harness.createExportVoucher(voucher)).rejects.toThrow(/insufficient stock/i);

      // CRITICAL ATOMICITY CHECK: Meter 1 MUST NOT be decremented!
      expect(harness.getStock(1, 1, undefined)).toBe(100);
      expect(harness.getStock(1, 2, undefined)).toBe(10);
    });
  });

  // =========================================================================
  // TIER 1.1: Workshop Repair Voucher All-or-Nothing Atomicity
  // =========================================================================
  describe('Workshop Repair Transaction Atomicity (All-or-Nothing BOM)', () => {
    it('should deduct all 12 spare parts and increment repaired meters when stock is sufficient', async () => {
      // Seed all 12 D15 parts with 100 units each at Unit 1 (KHO-VP), repaired meters = 0
      const initialParts = D15_STANDARD_BOM.map(p => ({
        unitId: 1,
        sparePartId: p.partId,
        quantity: 100,
      }));
      initialParts.push({ unitId: 1, meterId: 2 /* ĐH015(SC) */, quantity: 0 });
      harness.seed(initialParts);

      // Repair 30 meters
      const voucher: RepairVoucherInput = {
        code: 'PSC-2026-001',
        voucherDate: '2026-09-08',
        unitId: 1,
        meterId: 2,
        quantityRepaired: 30,
        partsUsed: D15_STANDARD_BOM.map(p => ({
          sparePartId: p.partId,
          quantity: 30 * p.quantityPerSet,
        })),
      };

      const result = await harness.createRepairVoucher(voucher);
      expect(result.status).toBe('completed');
      expect(result.quantityRepaired).toBe(30);

      // Verify all 12 parts decremented by 30
      for (const p of D15_STANDARD_BOM) {
        expect(harness.getStock(1, undefined, p.partId)).toBe(70);
      }
      // Verify repaired meters incremented by 30
      expect(harness.getStock(1, 2, undefined)).toBe(30);
    });

    it('should ROLLBACK all parts deductions if even 1 part is insufficient', async () => {
      // Parts 1..11 have 100, Part 12 (Gioăng cao su) has ONLY 15 units
      const initialParts = D15_STANDARD_BOM.map(p => ({
        unitId: 1,
        sparePartId: p.partId,
        quantity: p.partId === 12 ? 15 : 100,
      }));
      initialParts.push({ unitId: 1, meterId: 2, quantity: 5 });
      harness.seed(initialParts);

      // Attempt to repair 30 meters (requires 30 of part 12, but only 15 exist)
      const voucher: RepairVoucherInput = {
        code: 'PSC-2026-FAIL',
        voucherDate: '2026-09-08',
        unitId: 1,
        meterId: 2,
        quantityRepaired: 30,
        partsUsed: D15_STANDARD_BOM.map(p => ({
          sparePartId: p.partId,
          quantity: 30 * p.quantityPerSet,
        })),
      };

      await expect(harness.createRepairVoucher(voucher)).rejects.toThrow(/insufficient stock/i);

      // ATOMICITY VERIFICATION:
      // None of the other 11 parts should be deducted
      for (const p of D15_STANDARD_BOM) {
        if (p.partId === 12) {
          expect(harness.getStock(1, undefined, p.partId)).toBe(15);
        } else {
          expect(harness.getStock(1, undefined, p.partId)).toBe(100);
        }
      }
      // Repaired meter stock remains exactly at 5
      expect(harness.getStock(1, 2, undefined)).toBe(5);
    });
  });

  // =========================================================================
  // TIER 1.2: Inter-Unit Transfer Voucher Atomicity
  // =========================================================================
  describe('Inter-Unit Transfer Voucher Atomicity', () => {
    it('should simultaneously decrement source unit and increment destination unit', async () => {
      // Unit 1 (Kho VP) has 200 D15 meters, Unit 2 (TP1) has 10
      harness.seed([
        { unitId: 1, meterId: 1, quantity: 200 },
        { unitId: 2, meterId: 1, quantity: 10 },
      ]);

      const voucher: TransferVoucherInput = {
        code: 'PCK-2026-001',
        voucherDate: '2026-09-08',
        fromUnitId: 1,
        toUnitId: 2,
        details: [{ meterId: 1, quantity: 50 }],
      };

      const result = await harness.createTransferVoucher(voucher);
      expect(result.status).toBe('completed');

      expect(harness.getStock(1, 1, undefined)).toBe(150);
      expect(harness.getStock(2, 1, undefined)).toBe(60);
    });

    it('should ROLLBACK transfer if source unit has insufficient stock', async () => {
      harness.seed([
        { unitId: 1, meterId: 1, quantity: 20 },
        { unitId: 2, meterId: 1, quantity: 10 },
      ]);

      const voucher: TransferVoucherInput = {
        code: 'PCK-2026-FAIL',
        voucherDate: '2026-09-08',
        fromUnitId: 1,
        toUnitId: 2,
        details: [{ meterId: 1, quantity: 100 }], // 100 > 20
      };

      await expect(harness.createTransferVoucher(voucher)).rejects.toThrow(/insufficient stock/i);

      // Neither unit altered
      expect(harness.getStock(1, 1, undefined)).toBe(20);
      expect(harness.getStock(2, 1, undefined)).toBe(10);
    });
  });

  // =========================================================================
  // TIER 2 & 3: Unexpected Fault Injection Mid-Transaction
  // =========================================================================
  describe('Fault Injection & Database Error Resilience', () => {
    it('should completely restore original state when an unhandled exception occurs mid-transaction', async () => {
      harness.seed([
        { unitId: 1, meterId: 1, quantity: 100 },
        { unitId: 1, meterId: 2, quantity: 80 },
      ]);

      const faultTrigger = async () => {
        await harness.runTransaction(tx => {
          tx.decrementStock(1, 50, 1, undefined); // Successfully decremented Meter 1
          throw new Error('SIMULATED_DATABASE_IO_ERROR: Disk write failed');
        });
      };

      await expect(faultTrigger()).rejects.toThrow(/SIMULATED_DATABASE_IO_ERROR/);

      // Invariant: Meter 1 must remain 100, NOT 50
      expect(harness.getStock(1, 1, undefined)).toBe(100);
      expect(harness.getStock(1, 2, undefined)).toBe(80);
    });
  });

  // =========================================================================
  // TIER 4: Sequential Workload & No Negative Stock Invariant
  // =========================================================================
  describe('Tier 4: Sequential Depletion Stress Test', () => {
    it('should maintain strict zero negative stock across 50 sequential transactions', async () => {
      harness.seed([{ unitId: 1, sparePartId: 1, quantity: 100 }]);

      let successfulExports = 0;
      let rejectedExports = 0;

      for (let i = 0; i < 50; i++) {
        const requested = 5 + (i % 7); // requests varying from 5 to 11
        try {
          await harness.createExportVoucher({
            code: `PXK-STRESS-${i}`,
            voucherDate: '2026-09-08',
            unitId: 1,
            exportReason: 'sale',
            details: [{ sparePartId: 1, quantity: requested }],
          });
          successfulExports++;
        } catch {
          rejectedExports++;
        }
      }

      const finalStock = harness.getStock(1, undefined, 1);
      expect(finalStock).toBeGreaterThanOrEqual(0);
      expect(successfulExports).toBeGreaterThan(0);
      expect(rejectedExports).toBeGreaterThan(0);
    });
  });
});
