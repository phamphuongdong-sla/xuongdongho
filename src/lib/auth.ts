import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from './session';
import type { SessionUser, UserRole } from '@/types';

const PASSWORD_SALT = 'sowasuco_wm_salt_2026_secure';

/**
 * Hash a plain password using SHA-256 with salt.
 */
export function hashPassword(password: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${PASSWORD_SALT}:${password}`)
    .digest('hex');
  return `sha256:${hash}`;
}

/**
 * Verify a plain password against stored hash.
 * Supports modern sha256 hashes, exact matches, and demo fallback for legacy seed.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  // Modern sha256 hash check
  if (storedHash.startsWith('sha256:')) {
    const expected = hashPassword(password);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(storedHash));
  }

  // Legacy demo placeholder support
  if (storedHash.includes('Sample') || storedHash.startsWith('$2a$10$Sample')) {
    return password === '123456';
  }

  // Exact fallback
  return password === storedHash;
}

/**
 * Get active session user from Next.js cookie store.
 * Returns null if no cookie or invalid/expired session.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySession(token);
    if (!payload) return null;

    return {
      id: payload.id,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
      unitId: payload.unitId,
      unitName: payload.unitName,
      department: payload.department,
      originalRole: payload.originalRole,
    };
  } catch {
    // Non-request context or headless runner
    return null;
  }
}

/**
 * Guard function for Server Actions or Server Components.
 * Throws Unauthorized or Forbidden error if authentication fails.
 */
export async function requireAuth(allowedRoles?: UserRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('Unauthorized: Vui lòng đăng nhập để thực hiện thao tác này');
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasDirectRole = allowedRoles.includes(user.role);
    const isOriginalAdmin = user.originalRole === 'admin';
    if (!hasDirectRole && !isOriginalAdmin) {
      throw new Error(
        `Forbidden: Bạn không có quyền thực hiện thao tác này (yêu cầu vai trò: ${allowedRoles.join(', ')})`
      );
    }
  }

  return user;
}

export interface DemoPersona {
  email: string;
  fullName: string;
  role: UserRole;
  roleLabel: string;
  department: string;
  unitCode: string;
  unitName: string;
  avatarBg: string;
  badgeClass: string;
  description: string;
}

export const DEMO_PERSONAS: Record<UserRole, DemoPersona> = {
  admin: {
    email: 'admin@sowasuco.vn',
    fullName: 'Phạm Phương Đông',
    role: 'admin',
    roleLabel: 'Quản Trị Viên (Admin)',
    department: 'Phòng Quản lý Khách hàng',
    unitCode: 'KHO-VP',
    unitName: 'Xưởng đồng hồ',
    avatarBg: 'bg-purple-600',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Toàn quyền cấu hình hệ thống, quản trị người dùng, xóa/hoàn tác tồn kho, xem toàn bộ báo cáo',
  },
  kho: {
    email: 'thukho@sowasuco.vn',
    fullName: 'Nguyễn Văn Kho',
    role: 'kho',
    roleLabel: 'Thủ Kho (Xưởng đồng hồ)',
    department: 'Bộ phận Kho vật tư',
    unitCode: 'KHO-VP',
    unitName: 'Xưởng đồng hồ',
    avatarBg: 'bg-emerald-600',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Lập phiếu nhập kho theo hợp đồng, lập phiếu xuất 12 đơn vị, kiểm kê và quản lý kho thực tế',
  },
  ktv: {
    email: 'ktv@sowasuco.vn',
    fullName: 'Trần Kỹ Thuật',
    role: 'ktv',
    roleLabel: 'Kỹ Thuật Viên Xưởng Đồng Hồ',
    department: 'Xưởng đồng hồ',
    unitCode: 'KHO-VP',
    unitName: 'Xưởng đồng hồ',
    avatarBg: 'bg-amber-600',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Lập phiếu sửa chữa đồng hồ, xuất dùng linh kiện theo định mức, nhập đồng hồ quay vòng',
  },
  accountant: {
    email: 'ketoan@sowasuco.vn',
    fullName: 'Lê Thị Kế Toán',
    role: 'accountant',
    roleLabel: 'Lãnh Đạo / Kế Toán',
    department: 'Phòng Kế hoạch Tài chính',
    unitCode: 'KHO-VP',
    unitName: 'Xưởng đồng hồ',
    avatarBg: 'bg-blue-600',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Xem báo cáo đối soát, kiểm tra số liệu, xem và in ấn phiếu xuất/nhập, chế độ chỉ đọc',
  },
  unit_user: {
    email: 'chinhanh.tp1@sowasuco.vn',
    fullName: 'Lò Văn Nhánh',
    role: 'unit_user',
    roleLabel: 'Cán Bộ XNCN Số 1',
    department: 'XNCN Số 1',
    unitCode: 'XNCN-TP01',
    unitName: 'XNCN Số 1',
    avatarBg: 'bg-slate-600',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Xem danh sách cấp phát đồng hồ và kiểm tra tồn kho tại đơn vị trực thuộc',
  },
};
