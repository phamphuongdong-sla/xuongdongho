import { describe, it, expect, beforeAll } from 'vitest';
import {
  getInventoryService,
  referenceValidateExportStock,
  referenceValidateRepairBOM,
  D15_STANDARD_BOM,
  BOMItem,
} from '../helpers/inventory-helper';

describe('F14: Stock Constraint & BOM Validation Tests (Acceptance Criteria 5.2)', () => {
  let validateExportStock: typeof referenceValidateExportStock;
  let validateRepairBOM: typeof referenceValidateRepairBOM;
  let isRealService: boolean;

  beforeAll(async () => {
    const service = await getInventoryService();
    validateExportStock = service.validateExportStock;
    validateRepairBOM = service.validateRepairBOM;
    isRealService = service.isRealService;
    console.log(`Running stock-constraints tests using: ${isRealService ? 'LIVE SERVICE' : 'CONTRACT REFERENCE'}`);
  });

  // =========================================================================
  // TIER 1: Feature Tests (AC 5.2 Stock Constraint Invariant: available >= requested)
  // =========================================================================
  describe('Tier 1: Stock Constraint Verification (available >= requested)', () => {
    it('should permit export when available stock exceeds requested quantity', () => {
      const result = validateExportStock({
        availableStock: 500,
        requestedQuantity: 200,
      });

      expect(result.allowed).toBe(true);
      expect(result.remainingStock).toBe(300);
      expect(result.deficit).toBeUndefined();
    });

    it('should permit export when requested quantity exactly equals available stock (remaining = 0)', () => {
      const result = validateExportStock({
        availableStock: 150,
        requestedQuantity: 150,
      });

      expect(result.allowed).toBe(true);
      expect(result.remainingStock).toBe(0);
      expect(result.deficit).toBeUndefined();
    });

    it('should reject export when requested quantity exceeds available stock and return exact deficit', () => {
      const result = validateExportStock({
        availableStock: 100,
        requestedQuantity: 150,
      });

      expect(result.allowed).toBe(false);
      expect(result.remainingStock).toBe(100);
      expect(result.deficit).toBe(50);
    });

    it('should reject export when available stock is 0 and request is positive', () => {
      const result = validateExportStock({
        availableStock: 0,
        requestedQuantity: 10,
      });

      expect(result.allowed).toBe(false);
      expect(result.remainingStock).toBe(0);
      expect(result.deficit).toBe(10);
    });

    it('should allow zero quantity request without altering stock', () => {
      const result = validateExportStock({
        availableStock: 75,
        requestedQuantity: 0,
      });

      expect(result.allowed).toBe(true);
      expect(result.remainingStock).toBe(75);
    });
  });

  // =========================================================================
  // TIER 1.1: All-or-Nothing BOM Validation for Repair Vouchers
  // =========================================================================
  describe('Tier 1.1: All-or-Nothing BOM Validation for Workshop Repairs', () => {
    it('should approve repair voucher when all 12 BOM components have sufficient inventory', async () => {
      // Mock stock where every part has 100 in stock
      const stockMap = new Map<number, number>();
      D15_STANDARD_BOM.forEach(part => stockMap.set(part.partId, 100));

      const stockLookup = (partId: number) => stockMap.get(partId) ?? 0;

      // Repair 50 meters (requires 50 of each component)
      const result = await validateRepairBOM(1, 50, 1, stockLookup);

      expect(result.canProceed).toBe(true);
      expect(result.missingParts).toHaveLength(0);
    });

    it('should enforce ALL-OR-NOTHING: refuse repair if even a single spare part has deficit', async () => {
      // 11 parts have 100 in stock, but Nắp D15 (partId: 1) only has 40 in stock
      const stockMap = new Map<number, number>();
      D15_STANDARD_BOM.forEach(part => stockMap.set(part.partId, 100));
      stockMap.set(1, 40); // Deficit of 10 for repair quantity 50

      const stockLookup = (partId: number) => stockMap.get(partId) ?? 0;

      const result = await validateRepairBOM(1, 50, 1, stockLookup);

      expect(result.canProceed).toBe(false);
      expect(result.missingParts).toHaveLength(1);
      expect(result.missingParts[0]).toMatchObject({
        partId: 1,
        partCode: 'VP-D15-001',
        required: 50,
        available: 40,
        deficit: 10,
      });
    });

    it('should accurately report multiple missing parts with distinct deficits', async () => {
      const stockMap = new Map<number, number>();
      D15_STANDARD_BOM.forEach(part => stockMap.set(part.partId, 100));
      stockMap.set(1, 30); // Nắp: need 50, have 30 -> deficit 20
      stockMap.set(4, 45); // Mặt số: need 50, have 45 -> deficit 5
      stockMap.set(7, 0);  // Buồng đo: need 50, have 0 -> deficit 50

      const stockLookup = (partId: number) => stockMap.get(partId) ?? 0;

      const result = await validateRepairBOM(1, 50, 1, stockLookup);

      expect(result.canProceed).toBe(false);
      expect(result.missingParts).toHaveLength(3);

      const nap = result.missingParts.find(p => p.partId === 1);
      const matSo = result.missingParts.find(p => p.partId === 4);
      const buongDo = result.missingParts.find(p => p.partId === 7);

      expect(nap?.deficit).toBe(20);
      expect(matSo?.deficit).toBe(5);
      expect(buongDo?.deficit).toBe(50);
    });

    it('should approve zero quantity repair with empty missing parts list', async () => {
      const result = await validateRepairBOM(1, 0, 1, () => 0);
      expect(result.canProceed).toBe(true);
      expect(result.missingParts).toEqual([]);
    });
  });

  // =========================================================================
  // TIER 2: Boundary Value Analysis
  // =========================================================================
  describe('Tier 2: Boundary Value Analysis & Boundary Failures', () => {
    it('should reject when requested quantity is availableStock + 1 (off-by-one boundary)', () => {
      const result = validateExportStock({
        availableStock: 999,
        requestedQuantity: 1000,
      });

      expect(result.allowed).toBe(false);
      expect(result.deficit).toBe(1);
      expect(result.remainingStock).toBe(999);
    });

    it('should reject negative requested quantities with an explicit error', () => {
      expect(() =>
        validateExportStock({
          availableStock: 50,
          requestedQuantity: -1,
        })
      ).toThrow(/negative/i);
    });

    it('should reject negative available stock with an explicit error', () => {
      expect(() =>
        validateExportStock({
          availableStock: -10,
          requestedQuantity: 5,
        })
      ).toThrow(/negative/i);
    });

    it('should reject negative repair quantities in BOM validation', async () => {
      await expect(validateRepairBOM(1, -5, 1)).rejects.toThrow(/negative/i);
    });

    it('should handle custom multi-ratio BOM specifications correctly', async () => {
      // Suppose a meter requires 2 units of part A and 4 units of part B
      const customBOM: BOMItem[] = [
        { partId: 101, partCode: 'VP-CUSTOM-A', partName: 'Part A', quantityPerSet: 2 },
        { partId: 102, partCode: 'VP-CUSTOM-B', partName: 'Part B', quantityPerSet: 4 },
      ];

      const stockLookup = (partId: number) => {
        if (partId === 101) return 20; // Need 10 * 2 = 20 -> OK
        if (partId === 102) return 35; // Need 10 * 4 = 40 -> Short by 5
        return 0;
      };

      const result = await validateRepairBOM(99, 10, 1, stockLookup, () => customBOM);

      expect(result.canProceed).toBe(false);
      expect(result.missingParts).toHaveLength(1);
      expect(result.missingParts[0].partId).toBe(102);
      expect(result.missingParts[0].required).toBe(40);
      expect(result.missingParts[0].available).toBe(35);
      expect(result.missingParts[0].deficit).toBe(5);
    });
  });

  // =========================================================================
  // TIER 3: Pairwise Sequential Interaction Testing
  // =========================================================================
  describe('Tier 3: Sequential Inventory Depletion Simulation', () => {
    it('should correctly track remaining stock through a series of valid and rejected transactions', () => {
      let currentStock = 100;

      // Transaction 1: Request 40 -> Allowed (Stock becomes 60)
      const tx1 = validateExportStock({ availableStock: currentStock, requestedQuantity: 40 });
      expect(tx1.allowed).toBe(true);
      currentStock = tx1.remainingStock;
      expect(currentStock).toBe(60);

      // Transaction 2: Request 70 -> Rejected (Stock stays 60, deficit 10)
      const tx2 = validateExportStock({ availableStock: currentStock, requestedQuantity: 70 });
      expect(tx2.allowed).toBe(false);
      expect(tx2.deficit).toBe(10);
      // Invariant: Failed transaction must not alter stock
      expect(currentStock).toBe(60);

      // Transaction 3: Request 60 -> Allowed (Stock becomes 0)
      const tx3 = validateExportStock({ availableStock: currentStock, requestedQuantity: 60 });
      expect(tx3.allowed).toBe(true);
      currentStock = tx3.remainingStock;
      expect(currentStock).toBe(0);

      // Transaction 4: Request 1 -> Rejected (Stock stays 0, deficit 1)
      const tx4 = validateExportStock({ availableStock: currentStock, requestedQuantity: 1 });
      expect(tx4.allowed).toBe(false);
      expect(tx4.deficit).toBe(1);
      expect(currentStock).toBe(0);
    });
  });

  // =========================================================================
  // TIER 5: Adversarial Type and Boundary Tests
  // =========================================================================
  describe('Tier 5: Adversarial Type & Volume Stress', () => {
    it('should reject non-numeric and NaN parameters in export stock validation', () => {
      // @ts-expect-error Runtime invalid type
      expect(() => validateExportStock({ availableStock: '100', requestedQuantity: 50 })).toThrow();
      expect(() => validateExportStock({ availableStock: NaN, requestedQuantity: 50 })).toThrow();
      expect(() => validateExportStock({ availableStock: 100, requestedQuantity: NaN })).toThrow();
    });

    it('should handle massive request volumes accurately without integer precision loss', async () => {
      const stockMap = new Map<number, number>();
      D15_STANDARD_BOM.forEach(part => stockMap.set(part.partId, 50_000_000));
      const stockLookup = (partId: number) => stockMap.get(partId) ?? 0;

      // Request repair of 100,000,000 meters
      const result = await validateRepairBOM(1, 100_000_000, 1, stockLookup);

      expect(result.canProceed).toBe(false);
      expect(result.missingParts).toHaveLength(12);
      expect(result.missingParts[0].required).toBe(100_000_000);
      expect(result.missingParts[0].deficit).toBe(50_000_000);
    });
  });
});
