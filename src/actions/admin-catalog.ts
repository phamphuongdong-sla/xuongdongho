'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';

// ============================================================================
// 1. QUẢN LÝ DANH MỤC ĐỒNG HỒ NƯỚC
// ============================================================================
export async function getMetersCatalog() {
  return prisma.meter.findMany({
    orderBy: { code: 'asc' },
  });
}

export async function createMeter(data: {
  code: string;
  name: string;
  category: string;
  size?: string;
  unit?: string;
  manufacturer?: string;
  notes?: string;
}) {
  await requireAuth(['admin']);

  const meter = await prisma.meter.create({
    data: {
      code: data.code.trim(),
      name: data.name.trim(),
      category: data.category || 'Tiêu chuẩn',
      size: data.size || 'DN15',
      unit: data.unit || 'Cái',
      manufacturer: data.manufacturer,
      notes: data.notes,
      isActive: true,
    },
  });

  revalidatePath('/admin/users');
  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  revalidatePath('/contracts');
  revalidatePath('/distribution');
  revalidatePath('/used-meters');
  revalidatePath('/repairs');

  return { success: true, meter };
}

export async function updateMeter(
  id: number,
  data: {
    code?: string;
    name?: string;
    category?: string;
    size?: string;
    unit?: string;
    manufacturer?: string;
    notes?: string;
    isActive?: boolean;
  }
) {
  await requireAuth(['admin']);

  const meter = await prisma.meter.update({
    where: { id },
    data: {
      code: data.code?.trim(),
      name: data.name?.trim(),
      category: data.category,
      size: data.size,
      unit: data.unit,
      manufacturer: data.manufacturer,
      notes: data.notes,
      isActive: data.isActive,
    },
  });

  revalidatePath('/admin/users');
  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  revalidatePath('/contracts');
  revalidatePath('/distribution');
  revalidatePath('/used-meters');
  revalidatePath('/repairs');

  return { success: true, meter };
}

export async function deleteMeter(id: number) {
  await requireAuth(['admin']);

  // Instead of hard delete if referenced, we can toggle or delete if no references
  try {
    await prisma.meter.delete({ where: { id } });
  } catch (err) {
    // If foreign key constraint, deactivate instead
    await prisma.meter.update({
      where: { id },
      data: { isActive: false },
    });
  }

  revalidatePath('/admin/users');
  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  return { success: true };
}

// ============================================================================
// 2. QUẢN LÝ DANH MỤC VẬT TƯ LINH KIỆN
// ============================================================================
export async function getSparePartsCatalog() {
  return prisma.sparePart.findMany({
    orderBy: { code: 'asc' },
  });
}

export async function createSparePart(data: {
  code: string;
  name: string;
  category: string;
  size?: string;
  unit?: string;
  unitPrice?: number;
  minStock?: number;
  notes?: string;
}) {
  await requireAuth(['admin']);

  const part = await prisma.sparePart.create({
    data: {
      code: data.code.trim(),
      name: data.name.trim(),
      category: data.category || 'Linh kiện',
      size: data.size || 'DN15',
      unit: data.unit || 'Cái',
      unitPrice: data.unitPrice ?? 0,
      minStock: data.minStock ?? 10,
      notes: data.notes,
      isActive: true,
    },
  });

  revalidatePath('/admin/users');
  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  revalidatePath('/contracts');
  revalidatePath('/repairs');

  return { success: true, part };
}

export async function updateSparePart(
  id: number,
  data: {
    code?: string;
    name?: string;
    category?: string;
    size?: string;
    unit?: string;
    unitPrice?: number;
    minStock?: number;
    notes?: string;
    isActive?: boolean;
  }
) {
  await requireAuth(['admin']);

  const part = await prisma.sparePart.update({
    where: { id },
    data: {
      code: data.code?.trim(),
      name: data.name?.trim(),
      category: data.category,
      size: data.size,
      unit: data.unit,
      unitPrice: data.unitPrice !== undefined ? data.unitPrice : undefined,
      minStock: data.minStock,
      notes: data.notes,
      isActive: data.isActive,
    },
  });

  revalidatePath('/admin/users');
  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  revalidatePath('/contracts');
  revalidatePath('/repairs');

  return { success: true, part };
}

export async function deleteSparePart(id: number) {
  await requireAuth(['admin']);

  try {
    await prisma.sparePart.delete({ where: { id } });
  } catch (err) {
    await prisma.sparePart.update({
      where: { id },
      data: { isActive: false },
    });
  }

  revalidatePath('/admin/users');
  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  return { success: true };
}

// ============================================================================
// 3. QUẢN LÝ DANH SÁCH NHÂN VIÊN THEO ĐƠN VỊ
// ============================================================================
export async function getEmployeesCatalog() {
  return prisma.employee.findMany({
    include: { unit: true },
    orderBy: [{ unitId: 'asc' }, { fullName: 'asc' }],
  });
}

export async function createEmployee(data: {
  fullName: string;
  code?: string;
  phone?: string;
  unitId?: number;
  department?: string;
  position?: string;
  notes?: string;
}) {
  await requireAuth(['admin', 'kho']);

  const employee = await prisma.employee.create({
    data: {
      fullName: data.fullName.trim(),
      code: data.code?.trim(),
      phone: data.phone?.trim(),
      unitId: data.unitId ? Number(data.unitId) : null,
      department: data.department?.trim(),
      position: data.position?.trim(),
      notes: data.notes?.trim(),
      isActive: true,
    },
    include: { unit: true },
  });

  revalidatePath('/admin/users');
  revalidatePath('/used-meters');
  revalidatePath('/distribution');

  return { success: true, employee };
}

export async function updateEmployee(
  id: number,
  data: {
    fullName?: string;
    code?: string;
    phone?: string;
    unitId?: number;
    department?: string;
    position?: string;
    notes?: string;
    isActive?: boolean;
  }
) {
  await requireAuth(['admin', 'kho']);

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      fullName: data.fullName?.trim(),
      code: data.code?.trim(),
      phone: data.phone?.trim(),
      unitId: data.unitId !== undefined ? (data.unitId ? Number(data.unitId) : null) : undefined,
      department: data.department?.trim(),
      position: data.position?.trim(),
      notes: data.notes?.trim(),
      isActive: data.isActive,
    },
    include: { unit: true },
  });

  revalidatePath('/admin/users');
  revalidatePath('/used-meters');
  revalidatePath('/distribution');

  return { success: true, employee };
}

export async function deleteEmployee(id: number) {
  await requireAuth(['admin', 'kho']);

  try {
    await prisma.employee.delete({ where: { id } });
  } catch (err) {
    await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });
  }

  revalidatePath('/admin/users');
  revalidatePath('/used-meters');
  revalidatePath('/distribution');
  revalidatePath('/reports');
  revalidatePath('/unit-reports');
  return { success: true };
}

// ============================================================================
// 4. QUẢN LÝ DANH MỤC ĐƠN VỊ THÀNH VIÊN
// ============================================================================
export async function createUnit(data: {
  code: string;
  name: string;
  type?: string;
  address?: string;
  phone?: string;
  email?: string;
  sortOrder?: number;
}) {
  await requireAuth(['admin']);

  const existing = await prisma.unit.findUnique({
    where: { code: data.code.trim().toUpperCase() },
  });
  if (existing) {
    throw new Error(`Mã đơn vị '${data.code.trim().toUpperCase()}' đã tồn tại trên hệ thống`);
  }

  const unit = await prisma.unit.create({
    data: {
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      type: data.type?.trim() || 'Chi nhánh',
      address: data.address?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
      isActive: true,
    },
  });

  revalidatePath('/admin/users');
  revalidatePath('/distribution');
  revalidatePath('/used-meters');
  revalidatePath('/unit-reports');
  revalidatePath('/reports');

  return { success: true, unit };
}

export async function updateUnit(
  id: number,
  data: {
    code?: string;
    name?: string;
    type?: string;
    address?: string;
    phone?: string;
    email?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  await requireAuth(['admin']);

  const targetUnit = await prisma.unit.findUnique({ where: { id } });
  if (!targetUnit) {
    throw new Error('Không tìm thấy đơn vị cần cập nhật');
  }

  if (targetUnit.code === 'KHO-VP' && data.code && data.code.trim().toUpperCase() !== 'KHO-VP') {
    throw new Error('Không thể thay đổi mã của đơn vị Kho Văn phòng & Xưởng (KHO-VP) vì mã này là mã chuẩn hệ thống.');
  }

  if (data.code) {
    const existing = await prisma.unit.findFirst({
      where: {
        code: data.code.trim().toUpperCase(),
        id: { not: id },
      },
    });
    if (existing) {
      throw new Error(`Mã đơn vị '${data.code.trim().toUpperCase()}' đã được dùng bởi đơn vị khác`);
    }
  }

  const unit = await prisma.unit.update({
    where: { id },
    data: {
      code: data.code ? data.code.trim().toUpperCase() : undefined,
      name: data.name ? data.name.trim() : undefined,
      type: data.type ? data.type.trim() : undefined,
      address: data.address !== undefined ? (data.address?.trim() || null) : undefined,
      phone: data.phone !== undefined ? (data.phone?.trim() || null) : undefined,
      email: data.email !== undefined ? (data.email?.trim() || null) : undefined,
      sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : undefined,
      isActive: data.isActive !== undefined ? data.isActive : undefined,
    },
  });

  revalidatePath('/admin/users');
  revalidatePath('/distribution');
  revalidatePath('/used-meters');
  revalidatePath('/unit-reports');
  revalidatePath('/reports');

  return { success: true, unit };
}

export async function deleteUnit(id: number) {
  await requireAuth(['admin']);

  // Prevent deleting critical root units
  const unit = await prisma.unit.findUnique({ where: { id } });
  if (!unit) {
    throw new Error('Không tìm thấy đơn vị cần xóa');
  }

  if (unit.code === 'KHO-VP') {
    throw new Error('Không thể xóa đơn vị Kho Văn phòng Công ty & Xưởng');
  }

  // Check if unit has related transactions
  const [empCount, userCount, expCount, impCount] = await Promise.all([
    prisma.employee.count({ where: { unitId: id } }),
    prisma.user.count({ where: { unitId: id } }),
    prisma.exportVoucher.count({ where: { destinationUnitId: id } }),
    prisma.importVoucher.count({ where: { sourceUnitId: id } }),
  ]);

  if (empCount > 0 || userCount > 0 || expCount > 0 || impCount > 0) {
    throw new Error(
      `Không thể xóa đơn vị "${unit.name}" do đã có dữ liệu liên kết (${userCount} tài khoản, ${empCount} nhân viên, ${expCount + impCount} chứng từ nhập/xuất). Bạn có thể chỉnh sửa trạng thái Ngưng hoạt động.`
    );
  }

  await prisma.unit.delete({ where: { id } });

  revalidatePath('/admin/users');
  revalidatePath('/distribution');
  revalidatePath('/used-meters');
  revalidatePath('/unit-reports');
  revalidatePath('/reports');

  return { success: true };
}

export async function getCatalogAdminData() {
  const [meters, spareParts, employees, units] = await Promise.all([
    prisma.meter.findMany({ orderBy: { code: 'asc' } }),
    prisma.sparePart.findMany({ orderBy: { code: 'asc' } }),
    prisma.employee.findMany({ include: { unit: true }, orderBy: { fullName: 'asc' } }),
    prisma.unit.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);
  return { meters, spareParts, employees, units };
}

