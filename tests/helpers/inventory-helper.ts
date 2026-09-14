/**
 * Inventory Service Interface & Reference Adapter
 * Conforms to PROJECT.md § Interface Contracts
 */

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
  { partId: 1, partCode: 'VP-D15-001', partName: 'Nắp đồng hồ D15', quantityPerSet: 1 },
  { partId: 2, partCode: 'VP-D15-002', partName: 'Chụp xoay đồng hồ D15', quantityPerSet: 1 },
  { partId: 3, partCode: 'VP-D15-003', partName: 'Gioăng sắt', quantityPerSet: 1 },
  { partId: 4, partCode: 'VP-D15-004', partName: 'Mặt số đồng hồ D15', quantityPerSet: 1 },
  { partId: 5, partCode: 'VP-D15-005', partName: 'Nắp chặn buồng đo D15', quantityPerSet: 1 },
  { partId: 6, partCode: 'VP-D15-006', partName: 'Cánh quạt đồng hồ D15', quantityPerSet: 1 },
  { partId: 7, partCode: 'VP-D15-007', partName: 'Buồng đo đồng hồ D15', quantityPerSet: 1 },
  { partId: 8, partCode: 'VP-D15-008', partName: 'Bộ phận chỉnh bù lưu lượng D15 (vít tinh chỉnh)', quantityPerSet: 1 },
  { partId: 9, partCode: 'VP-D15-009', partName: 'Gioăng nắp chặn buồng đo D15 (số 9)', quantityPerSet: 1 },
  { partId: 10, partCode: 'VP-D15-010', partName: 'Gioăng ốc chặn nút chỉnh D15 (số 14)', quantityPerSet: 1 },
  { partId: 11, partCode: 'VP-D15-011', partName: 'Vành chống từ đồng hồ D15', quantityPerSet: 1 },
  { partId: 12, partCode: 'VP-D15-012', partName: 'Gioăng cao su chặn buồng đo D15 (số 12)', quantityPerSet: 1 },
];

/**
 * Reference implementation of calculateEndingBalance conforming to PROJECT.md:
 * Invariant: ending = (opening + totalImport) - totalExport. Throws if any input is negative.
 */
export function referenceCalculateEndingBalance(
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

  const ending = (opening + totalImport) - totalExport;
  if (ending < 0) {
    throw new Error(`Calculated ending balance is negative: ${ending} (${opening} + ${totalImport} - ${totalExport})`);
  }
  return ending;
}

/**
 * Reference implementation of validateExportStock conforming to PROJECT.md:
 * Invariant: requestedQuantity <= availableStock. If false, returns allowed: false.
 */
export function referenceValidateExportStock(params: ExportStockParams): ExportStockResult {
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
 * Reference implementation of validateRepairBOM conforming to PROJECT.md:
 * Invariant: All required spare parts for repairing quantity meters must be available in unit inventory.
 */
export async function referenceValidateRepairBOM(
  meterId: number,
  quantity: number,
  unitId: number,
  stockLookup?: (partId: number, unitId: number) => Promise<number> | number,
  bomLookup?: (meterId: number) => Promise<BOMItem[]> | BOMItem[]
): Promise<RepairBOMResult> {
  if (quantity < 0) {
    throw new Error(`Repair quantity cannot be negative: ${quantity}`);
  }
  if (quantity === 0) {
    return { canProceed: true, missingParts: [] };
  }

  const bom: BOMItem[] = bomLookup
    ? await bomLookup(meterId)
    : D15_STANDARD_BOM;

  const missingParts: MissingPart[] = [];

  for (const item of bom) {
    const required = item.quantityPerSet * quantity;
    const available = stockLookup
      ? await stockLookup(item.partId, unitId)
      : 0;

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

/**
 * Dynamic loader that returns implementation from src/services/inventory.service.ts
 * if present and valid, otherwise falls back to reference implementation.
 */
export async function getInventoryService() {
  try {
    const svc = await import('../../src/services/inventory.service');
    return {
      calculateEndingBalance: svc.calculateEndingBalance || referenceCalculateEndingBalance,
      validateExportStock: svc.validateExportStock || referenceValidateExportStock,
      validateRepairBOM: svc.validateRepairBOM || referenceValidateRepairBOM,
      isRealService: true,
    };
  } catch {
    return {
      calculateEndingBalance: referenceCalculateEndingBalance,
      validateExportStock: referenceValidateExportStock,
      validateRepairBOM: referenceValidateRepairBOM,
      isRealService: false,
    };
  }
}
