/**
 * src/services/inventory.service.ts
 * SOWASUCO Water Meter Management System (SOWASUCO WM)
 * Domain service for inventory balance calculations and constraint validations.
 * Conforms to PROJECT.md § Interface Contracts
 */

import { prisma } from '../lib/prisma';

export interface ExportStockParams {
  availableStock: number;
  requestedQuantity: number;
}

export interface ExportStockResult {
  allowed: boolean;
  remainingStock: number;
  deficit?: number;
}

export interface MissingPart {
  partId: number;
  partCode?: string;
  partName?: string;
  required: number;
  available: number;
  deficit: number;
}

export interface RepairBOMResult {
  canProceed: boolean;
  missingParts: MissingPart[];
}

export interface BOMItem {
  partId: number;
  partCode: string;
  partName: string;
  quantityPerSet: number;
}

/**
 * Standard D15 Water Meter Bill of Materials (12 core components)
 * Source: sowasuco_wm_spec.md § II.B & sowasuco_wm_database.sql
 */
export const D15_STANDARD_BOM: BOMItem[] = [
  { partId: 1, partCode: 'VP-D15-001', partName: 'Nắp đồng hồ DN15', quantityPerSet: 1 },
  { partId: 2, partCode: 'VP-D15-002', partName: 'Chụp xoay DN15', quantityPerSet: 1 },
  { partId: 3, partCode: 'VP-D15-003', partName: 'Gioăng sắt DN15', quantityPerSet: 1 },
  { partId: 4, partCode: 'VP-D15-004', partName: 'Mặt số DN15', quantityPerSet: 1 },
  { partId: 5, partCode: 'VP-D15-005', partName: 'Nắp chặn buồng đo DN15', quantityPerSet: 1 },
  { partId: 6, partCode: 'VP-D15-006', partName: 'Cánh quạt DN15', quantityPerSet: 1 },
  { partId: 7, partCode: 'VP-D15-007', partName: 'Buồng đo DN15', quantityPerSet: 1 },
  { partId: 8, partCode: 'VP-D15-008', partName: 'Vít tinh chỉnh DN15', quantityPerSet: 1 },
  { partId: 9, partCode: 'VP-D15-009', partName: 'Gioăng nắp chặn buồng đo DN15 (số 9)', quantityPerSet: 1 },
  { partId: 10, partCode: 'VP-D15-010', partName: 'Gioăng ốc chặn nút chỉnh DN15 (số 14)', quantityPerSet: 1 },
  { partId: 11, partCode: 'VP-D15-011', partName: 'Vành chống từ DN15', quantityPerSet: 1 },
  { partId: 12, partCode: 'VP-D15-012', partName: 'Gioăng cao su buồng đo DN15 (số 12)', quantityPerSet: 1 },
];

/**
 * Calculates ending inventory balance.
 * Invariant: ending = (opening + totalImport) - totalExport
 * Throws TypeError if parameters are not numbers or are NaN.
 * Throws Error if any parameter is negative or if calculated ending is negative.
 */
export function calculateEndingBalance(
  opening: number,
  totalImport: number,
  totalExport: number
): number {
  if (typeof opening !== 'number' || typeof totalImport !== 'number' || typeof totalExport !== 'number') {
    throw new TypeError('All inventory quantities must be numbers');
  }
  if (isNaN(opening) || isNaN(totalImport) || isNaN(totalExport)) {
    throw new TypeError('Inventory quantities cannot be NaN');
  }
  if (opening < 0) {
    throw new Error(`Negative opening balance not allowed: ${opening}`);
  }
  if (totalImport < 0) {
    throw new Error(`Negative import quantity not allowed: ${totalImport}`);
  }
  if (totalExport < 0) {
    throw new Error(`Negative export quantity not allowed: ${totalExport}`);
  }

  const ending = opening + totalImport - totalExport;
  if (ending < 0) {
    throw new Error(
      `Calculated ending balance is negative: ${ending} (${opening} + ${totalImport} - ${totalExport})`
    );
  }
  return ending;
}

/**
 * Validates stock export constraints (AC 5.2).
 * Invariant: requestedQuantity <= availableStock.
 * Throws TypeError if inputs are not numbers or NaN.
 * Throws Error if inputs are negative.
 */
export function validateExportStock(params: ExportStockParams): ExportStockResult {
  const { availableStock, requestedQuantity } = params;

  if (typeof availableStock !== 'number' || typeof requestedQuantity !== 'number') {
    throw new TypeError('Stock quantities must be numbers');
  }
  if (isNaN(availableStock) || isNaN(requestedQuantity)) {
    throw new TypeError('Stock quantities cannot be NaN');
  }
  if (availableStock < 0) {
    throw new Error(`Invalid negative available stock: ${availableStock}`);
  }
  if (requestedQuantity < 0) {
    throw new Error(`Invalid negative requested quantity: ${requestedQuantity}`);
  }

  if (requestedQuantity <= availableStock) {
    return {
      allowed: true,
      remainingStock: availableStock - requestedQuantity,
    };
  } else {
    return {
      allowed: false,
      remainingStock: availableStock,
      deficit: requestedQuantity - availableStock,
    };
  }
}

/**
 * Validates Bill of Materials availability for workshop repair (All-or-nothing).
 * Invariant: All required spare parts for repairing quantity meters must be available in unit inventory.
 */
export async function validateRepairBOM(
  meterId: number,
  quantity: number,
  unitId: number,
  stockLookup?: (partId: number, unitId: number) => Promise<number> | number,
  bomLookup?: (meterId: number) => Promise<BOMItem[]> | BOMItem[]
): Promise<RepairBOMResult> {
  if (typeof quantity !== 'number' || isNaN(quantity)) {
    throw new TypeError('Quantity must be a valid number');
  }
  if (quantity < 0) {
    throw new Error(`Repair quantity cannot be negative: ${quantity}`);
  }
  if (quantity === 0) {
    return { canProceed: true, missingParts: [] };
  }

  let bom: BOMItem[];
  if (bomLookup) {
    bom = await bomLookup(meterId);
  } else {
    try {
      const dbBOM = await prisma.meterSparePart.findMany({
        where: { meterId },
        include: { sparePart: true },
      });
      if (dbBOM && dbBOM.length > 0) {
        bom = dbBOM.map(item => ({
          partId: item.sparePartId,
          partCode: item.sparePart.code,
          partName: item.sparePart.name,
          quantityPerSet: item.quantityPerSet,
        }));
      } else {
        bom = D15_STANDARD_BOM;
      }
    } catch {
      bom = D15_STANDARD_BOM;
    }
  }

  const missingParts: MissingPart[] = [];

  for (const item of bom) {
    const required = item.quantityPerSet * quantity;
    let available = 0;

    if (stockLookup) {
      available = await stockLookup(item.partId, unitId);
    } else {
      try {
        const inv = await prisma.inventory.findFirst({
          where: {
            unitId,
            sparePartId: item.partId,
            status: 'new',
          },
        });
        available = inv?.quantity ?? 0;
      } catch {
        available = 0;
      }
    }

    if (available < required) {
      missingParts.push({
        partId: item.partId,
        partCode: item.partCode,
        partName: item.partName,
        required,
        available,
        deficit: required - available,
      });
    }
  }

  return {
    canProceed: missingParts.length === 0,
    missingParts,
  };
}
