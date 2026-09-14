/**
 * Voucher Service Contract & Transaction Simulator
 * Conforms to PROJECT.md § Voucher Service Contract
 */

export interface VoucherDetailInput {
  meterId?: number;
  sparePartId?: number;
  quantity: number;
  unitPrice?: number;
}

export interface ExportVoucherInput {
  code: string;
  voucherDate: string;
  unitId: number;
  exportReason: 'sale' | 'repair_allocation' | 'discard';
  details: VoucherDetailInput[];
}

export interface RepairVoucherInput {
  code: string;
  voucherDate: string;
  unitId: number;
  meterId: number;
  quantityRepaired: number;
  partsUsed: Array<{ sparePartId: number; quantity: number }>;
}

export interface TransferVoucherInput {
  code: string;
  voucherDate: string;
  fromUnitId: number;
  toUnitId: number;
  details: VoucherDetailInput[];
}

export interface MockInventoryRecord {
  unitId: number;
  meterId?: number;
  sparePartId?: number;
  quantity: number;
}

export class TransactionalInventoryHarness {
  private state: Map<string, number> = new Map();

  constructor(initialRecords: MockInventoryRecord[] = []) {
    this.seed(initialRecords);
  }

  private getKey(unitId: number, meterId?: number, sparePartId?: number): string {
    return `${unitId}:${meterId ?? 'null'}:${sparePartId ?? 'null'}`;
  }

  public seed(records: MockInventoryRecord[]): void {
    this.state.clear();
    for (const r of records) {
      this.state.set(this.getKey(r.unitId, r.meterId, r.sparePartId), r.quantity);
    }
  }

  public getStock(unitId: number, meterId?: number, sparePartId?: number): number {
    return this.state.get(this.getKey(unitId, meterId, sparePartId)) ?? 0;
  }

  public cloneState(): Map<string, number> {
    return new Map(this.state);
  }

  /**
   * Simulates prisma.$transaction with full ACID rollback semantics
   */
  public async runTransaction<T>(
    operation: (tx: {
      getStock: (unitId: number, meterId?: number, sparePartId?: number) => number;
      decrementStock: (unitId: number, quantity: number, meterId?: number, sparePartId?: number) => void;
      incrementStock: (unitId: number, quantity: number, meterId?: number, sparePartId?: number) => void;
    }) => Promise<T> | T
  ): Promise<T> {
    const snapshot = new Map(this.state);
    const pendingChanges = new Map(this.state);

    const txContext = {
      getStock: (unitId: number, meterId?: number, sparePartId?: number) => {
        const key = this.getKey(unitId, meterId, sparePartId);
        return pendingChanges.get(key) ?? 0;
      },
      decrementStock: (unitId: number, quantity: number, meterId?: number, sparePartId?: number) => {
        if (quantity < 0) throw new Error('Quantity to decrement must be non-negative');
        const key = this.getKey(unitId, meterId, sparePartId);
        const current = pendingChanges.get(key) ?? 0;
        if (current < quantity) {
          throw new Error(
            `Insufficient stock for item at unit ${unitId}. Available: ${current}, Requested: ${quantity}, Deficit: ${quantity - current}`
          );
        }
        pendingChanges.set(key, current - quantity);
      },
      incrementStock: (unitId: number, quantity: number, meterId?: number, sparePartId?: number) => {
        if (quantity < 0) throw new Error('Quantity to increment must be non-negative');
        const key = this.getKey(unitId, meterId, sparePartId);
        const current = pendingChanges.get(key) ?? 0;
        pendingChanges.set(key, current + quantity);
      },
    };

    try {
      const result = await operation(txContext);
      // Transaction committed
      this.state = pendingChanges;
      return result;
    } catch (error) {
      // Transaction aborted -> rollback to snapshot
      this.state = snapshot;
      throw error;
    }
  }

  /**
   * Reference createExportVoucher with transaction atomicity
   */
  public async createExportVoucher(input: ExportVoucherInput) {
    return this.runTransaction(async tx => {
      // Step 1: Validate all lines before applying
      for (const line of input.details) {
        const available = tx.getStock(input.unitId, line.meterId, line.sparePartId);
        if (available < line.quantity) {
          throw new Error(
            `Export rejected: Insufficient stock for ${line.sparePartId ? 'part ' + line.sparePartId : 'meter ' + line.meterId}. Available: ${available}, Requested: ${line.quantity}, Deficit: ${line.quantity - available}`
          );
        }
      }

      // Step 2: Decrement stock atomically
      for (const line of input.details) {
        tx.decrementStock(input.unitId, line.quantity, line.meterId, line.sparePartId);
      }

      return {
        id: Math.floor(Math.random() * 10000),
        code: input.code,
        status: 'confirmed',
        itemsCount: input.details.length,
      };
    });
  }

  /**
   * Reference createRepairVoucher with transaction atomicity
   */
  public async createRepairVoucher(input: RepairVoucherInput) {
    return this.runTransaction(async tx => {
      // Deduct all parts
      for (const part of input.partsUsed) {
        tx.decrementStock(input.unitId, part.quantity, undefined, part.sparePartId);
      }

      // Increment repaired meter stock (e.g. meterId in ready status)
      tx.incrementStock(input.unitId, input.quantityRepaired, input.meterId, undefined);

      return {
        id: Math.floor(Math.random() * 10000),
        code: input.code,
        quantityRepaired: input.quantityRepaired,
        status: 'completed',
      };
    });
  }

  /**
   * Reference createTransferVoucher with transaction atomicity
   */
  public async createTransferVoucher(input: TransferVoucherInput) {
    return this.runTransaction(async tx => {
      for (const line of input.details) {
        tx.decrementStock(input.fromUnitId, line.quantity, line.meterId, line.sparePartId);
        tx.incrementStock(input.toUnitId, line.quantity, line.meterId, line.sparePartId);
      }

      return {
        id: Math.floor(Math.random() * 10000),
        code: input.code,
        status: 'completed',
      };
    });
  }
}

/**
 * Dynamic loader that checks if real voucher service exists
 */
export async function getVoucherService() {
  try {
    const svc = await import('../../src/services/voucher.service');
    return {
      service: svc,
      isRealService: true,
    };
  } catch {
    return {
      service: null,
      isRealService: false,
    };
  }
}
