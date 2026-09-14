'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, hashPassword } from '@/lib/auth';

const VALID_ROLES = ['admin', 'accountant', 'kho', 'ktv', 'unit_user'] as const;
type ManagedRole = (typeof VALID_ROLES)[number];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validateUserInput(data: { fullName?: string; email?: string; role?: string; password?: string }) {
  if (data.fullName !== undefined && !data.fullName.trim()) {
    throw new Error('Họ và tên không được để trống');
  }
  if (data.email !== undefined && !/^\S+@\S+\.\S+$/.test(data.email)) {
    throw new Error('Email đăng nhập không hợp lệ');
  }
  if (data.role !== undefined && !VALID_ROLES.includes(data.role as ManagedRole)) {
    throw new Error('Vai trò được chọn không hợp lệ');
  }
  if (data.password !== undefined && data.password.length < 6) {
    throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
  }
}

export async function getUsersManagementData() {
  await requireAuth(['admin', 'kho']);
  const [users, units] = await Promise.all([
    prisma.user.findMany({
      include: {
        unit: true,
      },
      orderBy: { id: 'asc' },
    }),
    prisma.unit.findMany({
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  return {
    users,
    units,
  };
}

export async function createUser(data: {
  fullName: string;
  email: string;
  phone?: string;
  department?: string;
  role: string;
  unitId?: number;
  password: string;
}) {
  await requireAuth(['admin']);
  if (!data.fullName?.trim() || !data.email?.trim() || !data.password) {
    throw new Error('Vui lòng nhập đầy đủ họ tên, email và mật khẩu');
  }
  validateUserInput(data);
  const email = normalizeEmail(data.email);

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error(`Email ${email} đã tồn tại trong hệ thống`);
  }

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName.trim(),
      email,
      phone: data.phone || null,
      department: data.department || null,
      role: data.role as ManagedRole,
      unitId: data.unitId ? Number(data.unitId) : null,
      passwordHash: hashPassword(data.password),
      isActive: true,
    },
  });

  revalidatePath('/admin/users');
  return user;
}

export async function updateUser(
  id: number,
  data: {
    fullName?: string;
    email?: string;
    phone?: string;
    department?: string;
    role?: string;
    unitId?: number | null;
    isActive?: boolean;
  }
) {
  await requireAuth(['admin']);
  validateUserInput(data);
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) throw new Error('Không tìm thấy người dùng');

  if (existingUser.role === 'admin' && data.role !== undefined && data.role !== 'admin') {
    const activeAdminCount = await prisma.user.count({
      where: { role: 'admin', isActive: true, NOT: { id } },
    });
    if (activeAdminCount === 0) {
      throw new Error('Không thể hạ quyền tài khoản Quản trị viên duy nhất trong hệ thống');
    }
  }

  if (data.email !== undefined) {
    const email = normalizeEmail(data.email);
    const owner = await prisma.user.findUnique({ where: { email } });
    if (owner && owner.id !== id) {
      throw new Error(`Email ${email} đã tồn tại trong hệ thống`);
    }
  }

  const updateData: any = {};
  if (data.fullName !== undefined) updateData.fullName = data.fullName.trim();
  if (data.email !== undefined) updateData.email = normalizeEmail(data.email);
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.department !== undefined) updateData.department = data.department;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.unitId !== undefined) updateData.unitId = data.unitId ? Number(data.unitId) : null;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/admin/users');
  return user;
}

/** Đặt lại mật khẩu theo yêu cầu của quản trị viên; không bao giờ trả hash về trình duyệt. */
export async function resetUserPassword(id: number, password: string) {
  await requireAuth(['admin']);
  validateUserInput({ password });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('Không tìm thấy người dùng');

  await prisma.user.update({
    where: { id },
    data: { passwordHash: hashPassword(password) },
  });

  revalidatePath('/admin/users');
  return { success: true };
}


export async function toggleUserStatus(id: number) {
  await requireAuth(['admin']);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('Không tìm thấy người dùng');

  if (user.role === 'admin' && user.isActive) {
    const activeAdminCount = await prisma.user.count({ where: { role: 'admin', isActive: true } });
    if (activeAdminCount <= 1) {
      throw new Error('Hệ thống phải luôn có ít nhất một Quản trị viên đang hoạt động');
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });

  revalidatePath('/admin/users');
  return updated;
}

export async function deleteUser(id: number) {
  await requireAuth(['admin']);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('Không tìm thấy người dùng');

  if (user.role === 'admin') {
    const adminCount = await prisma.user.count({ where: { role: 'admin' } });
    if (adminCount <= 1) {
      throw new Error('Không thể xóa tài khoản Quản trị viên duy nhất trong hệ thống');
    }
  }

  await prisma.user.delete({
    where: { id },
  });

  revalidatePath('/admin/users');
  return { success: true };
}
