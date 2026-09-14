// Role & Permission Types
export type UserRole = 'admin' | 'accountant' | 'kho' | 'ktv' | 'unit_user';

export interface SessionUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  unitId: number | null;
  unitName?: string | null;
  department?: string | null;
  originalRole?: UserRole;
}

export interface SessionPayload extends SessionUser {
  iat: number;
  exp: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
  user?: SessionUser;
  token?: string;
}


// Unit & Organization Types
export type UnitType = 'Kho/Xưởng' | 'Xí nghiệp' | 'Chi nhánh' | 'Dự phòng';

// Catalog Categories & Sizes
export type MeterCategory = 'Tiêu chuẩn' | 'Sửa chữa' | 'Ngoại nhập';
export type MeterSize =
  | 'DN15'
  | 'DN20'
  | 'DN25'
  | 'DN32'
  | 'DN40'
  | 'DN50'
  | 'DN65'
  | 'DN80'
  | 'DN100'
  | 'DN150'
  | 'DN200';

export type SparePartCategory =
  | 'Nắp'
  | 'Chụp'
  | 'Mặt số'
  | 'Cánh quạt'
  | 'Buồng đo'
  | 'Bộ phận chỉnh'
  | 'Gioăng'
  | 'Ốc chặn'
  | 'Vành chống từ'
  | 'Nắp chặn'
  | 'Vành'
  | 'Vòng chặn'
  | 'Lưới lọc';

// Core 4-Tier Inventory States
export type InventoryStatus =
  | 'new'            // Mới 100%
  | 'circulating'    // Quay vòng (đã sửa chữa hoàn tất)
  | 'sent_for_repair'// Đơn vị gửi về / Chờ xưởng sửa
  | 'broken';        // Hỏng không sửa được / Chờ thanh lý

// Contract & Procurement States
export type ContractStatus = 'active' | 'completed' | 'cancelled';
export type ContractBatchStatus = 'pending' | 'delivering' | 'completed';

// Voucher Statuses & Reasons
export type VoucherStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled';

export type ImportReason =
  | 'purchase_contract'
  | 'purchase_new'
  | 'repair_return'
  | 'transfer'
  | 'other';

export type ExportReason =
  | 'unit_distribution'
  | 'repair_allocation'
  | 'liquidation'
  | 'other';

export type TransferType = 'dispatch_to_unit' | 'return_to_workshop';
export type TransferStatus = 'draft' | 'in_transit' | 'received' | 'completed' | 'cancelled';

// Repair States
export type RepairStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

// Inspection & Testing States
export type InspectionType = 'incoming' | 'warranty_check' | 'extraordinary';

// Alert & Audit
export type AlertType = 'low_stock' | 'out_of_stock' | 'repair_backlog';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'CONFIRM' | 'CANCEL';
