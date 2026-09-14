import { describe, it, expect, beforeAll } from 'vitest';
import { getInventoryService, referenceCalculateEndingBalance } from '../helpers/inventory-helper';
import oracleData from '../fixtures/excel-oracle.json';

describe('F13: Inventory Balance Formula & Invariant Tests (Acceptance Criteria 5.1)', () => {
  let calculateEndingBalance: typeof referenceCalculateEndingBalance;
  let isRealService: boolean;

  beforeAll(async () => {
    const service = await getInventoryService();
    calculateEndingBalance = service.calculateEndingBalance;
    isRealService = service.isRealService;
    console.log(`Running inventory-balance tests using: ${isRealService ? 'LIVE SERVICE' : 'CONTRACT REFERENCE'}`);
  });

  // =========================================================================
  // TIER 1: Feature Tests (Happy Path from Excel Oracle)
  // =========================================================================
  describe('Tier 1: Formula Invariant (Ending = Opening + Import - Export)', () => {
    it('should correctly calculate ending balance for standard meter D15', () => {
      // Excel row 6: ĐH015: Opening 0, Import 2240, Export 1740 -> Ending 500
      const ending = calculateEndingBalance(0, 2240, 1740);
      expect(ending).toBe(500);
    });

    it('should correctly calculate zero ending balance for repaired meter ĐH015(SC)', () => {
      // Excel row 7: ĐH015(SC): Opening 0, Import 6969, Export 6969 -> Ending 0
      const ending = calculateEndingBalance(0, 6969, 6969);
      expect(ending).toBe(0);
    });

    it('should correctly calculate ending balance with non-zero opening balance (Chụp xoay D15)', () => {
      // Excel spare parts STT 2: Opening 138, Import 9000, Used 6490 -> Ending 2648
      const ending = calculateEndingBalance(138, 9000, 6490);
      expect(ending).toBe(2648);
    });

    it('should correctly calculate ending balance for low-usage spare part (Mặt số D15)', () => {
      // Excel spare parts STT 4: Opening 2570, Import 4000, Used 6010 -> Ending 560
      const ending = calculateEndingBalance(2570, 4000, 6010);
      expect(ending).toBe(560);
    });

    it('should correctly calculate ending balance for zero-transaction meters', () => {
      // Meters with 0 activity (e.g. ĐH020): Opening 0, Import 0, Export 0 -> Ending 0
      const ending = calculateEndingBalance(0, 0, 0);
      expect(ending).toBe(0);
    });

    it('should match authoritative Excel closing balance for all 25 water meters', () => {
      for (const meter of oracleData.meters) {
        const calculated = calculateEndingBalance(meter.opening, meter.import, meter.export);
        expect(calculated).toBe(meter.ending);
        expect(calculated).toBe(meter.formula_balance);
      }
    });

    it('should match authoritative Excel closing balance for all 35 spare parts', () => {
      for (const part of oracleData.spare_parts) {
        const calculated = calculateEndingBalance(part.opening, part.total_import, part.total_used);
        expect(calculated).toBe(part.ending);
        expect(calculated).toBe(part.formula_balance);
      }
    });
  });

  // =========================================================================
  // TIER 1.1: Monthly Roll-Forward Verification
  // =========================================================================
  describe('Tier 1.1: Monthly Roll-Forward Invariants', () => {
    it('should verify month-by-month roll-forward continuity for active spare parts', () => {
      // For parts with no mid-year deficit, Ending(M) == Opening(M+1)
      const testPart = oracleData.spare_parts.find(p => p.stt === 1); // Nắp D15
      expect(testPart).toBeDefined();

      let currentStock = testPart!.opening;
      for (let m = 0; m < 12; m++) {
        const monthIn = testPart!.monthly_in[m];
        const monthOut = testPart!.monthly_out[m];
        currentStock = calculateEndingBalance(currentStock, monthIn, monthOut);
      }

      expect(currentStock).toBe(testPart!.ending);
    });

    it('should verify yearly cumulative reconciliation equals monthly roll-forward', () => {
      const part = oracleData.spare_parts.find(p => p.stt === 4); // Mặt số D15
      expect(part).toBeDefined();

      // Cumulative
      const cumulativeEnding = calculateEndingBalance(part!.opening, part!.total_import, part!.total_used);

      // Roll-forward
      let rollForwardStock = part!.opening;
      for (let m = 0; m < 12; m++) {
        rollForwardStock = calculateEndingBalance(rollForwardStock, part!.monthly_in[m], part!.monthly_out[m]);
      }

      expect(rollForwardStock).toBe(cumulativeEnding);
      expect(rollForwardStock).toBe(part!.ending);
    });
  });

  // =========================================================================
  // TIER 2: Boundary Value Analysis & Error Handling
  // =========================================================================
  describe('Tier 2: Boundary Value Analysis & Invalid Input Rejection', () => {
    it('should throw error when opening stock is negative', () => {
      expect(() => calculateEndingBalance(-1, 100, 50)).toThrow(/negative/i);
      expect(() => calculateEndingBalance(-500, 0, 0)).toThrow(/negative/i);
    });

    it('should throw error when import quantity is negative', () => {
      expect(() => calculateEndingBalance(100, -10, 50)).toThrow(/negative/i);
      expect(() => calculateEndingBalance(0, -1, 0)).toThrow(/negative/i);
    });

    it('should throw error when export quantity is negative', () => {
      expect(() => calculateEndingBalance(100, 50, -5)).toThrow(/negative/i);
      expect(() => calculateEndingBalance(0, 0, -1)).toThrow(/negative/i);
    });

    it('should reject transactions where total export exceeds available stock', () => {
      // Opening: 10, Import: 20 -> Available: 30. Requested Export: 31
      expect(() => calculateEndingBalance(10, 20, 31)).toThrow(/negative/i);
    });

    it('should allow boundary condition where export equals exact available stock (resulting in 0)', () => {
      const ending = calculateEndingBalance(100, 250, 350);
      expect(ending).toBe(0);
    });

    it('should allow boundary condition where export is 0 (ending equals opening + import)', () => {
      const ending = calculateEndingBalance(150, 350, 0);
      expect(ending).toBe(500);
    });

    it('should handle large volumes without integer overflow', () => {
      const ending = calculateEndingBalance(100_000_000, 500_000_000, 200_000_000);
      expect(ending).toBe(400_000_000);
    });
  });

  // =========================================================================
  // TIER 5: Adversarial Stress & Type Robustness
  // =========================================================================
  describe('Tier 5: Adversarial Verification & Type Safety', () => {
    it('should reject NaN values gracefully', () => {
      expect(() => calculateEndingBalance(NaN, 10, 5)).toThrow();
      expect(() => calculateEndingBalance(10, NaN, 5)).toThrow();
      expect(() => calculateEndingBalance(10, 5, NaN)).toThrow();
    });

    it('should reject non-numeric types gracefully', () => {
      // @ts-expect-error Testing runtime invalid types
      expect(() => calculateEndingBalance('100', 50, 20)).toThrow();
      // @ts-expect-error Testing runtime null
      expect(() => calculateEndingBalance(null, 50, 20)).toThrow();
      // @ts-expect-error Testing runtime undefined
      expect(() => calculateEndingBalance(undefined, 50, 20)).toThrow();
    });

    it('should maintain mathematical precision across repeated increments and decrements', () => {
      let balance = 1000;
      for (let i = 0; i < 100; i++) {
        balance = calculateEndingBalance(balance, 15, 10);
      }
      expect(balance).toBe(1000 + 100 * 5); // 1500
    });
  });
});
