'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { signSession, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/session';
import { verifyPassword, getSessionUser, DEMO_PERSONAS } from '@/lib/auth';
import type { AuthResult, SessionUser, UserRole } from '@/types';

/**
 * Standard email + password login action.
 */
export async function loginWithCredentials(formData: FormData): Promise<AuthResult> {
  try {
    const email = formData.get('email')?.toString().trim().toLowerCase();
    const password = formData.get('password')?.toString() || '';

    if (!email || !password) {
      return { success: false, error: 'Vui lòng nhập đầy đủ Email và Mật khẩu' };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { unit: true },
    });

    if (!user || !user.isActive) {
      return { success: false, error: 'Tài khoản không tồn tại hoặc đã bị khóa' };
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Mật khẩu không chính xác' };
    }

    // Update lastLogin timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as UserRole,
      unitId: user.unitId,
      unitName: user.unit?.name ?? null,
      department: user.department,
    };

    const token = await signSession(sessionUser);
    try {
      const cookieStore = cookies();
      cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    } catch {
      // Non-request context (e.g. test runner)
    }

    return {
      success: true,
      redirectTo: '/',
      user: sessionUser,
      token,
    };
  } catch (err: any) {
    console.error('Error in loginWithCredentials:', err);
    return { success: false, error: err.message || 'Đã xảy ra lỗi trong quá trình đăng nhập' };
  }
}

/**
 * 1-Click Quick Login action for demo personas.
 */
export async function quickLogin(role: UserRole): Promise<AuthResult> {
  try {
    const persona = DEMO_PERSONAS[role];
    let user = null;

    if (persona) {
      user = await prisma.user.findUnique({
        where: { email: persona.email },
        include: { unit: true },
      });
    }

    if (!user) {
      user = await prisma.user.findFirst({
        where: { role, isActive: true },
        include: { unit: true },
      });
    }

    if (!user) {
      return {
        success: false,
        error: `Không tìm thấy tài khoản người dùng tương ứng vai trò ${role}`,
      };
    }

    // Update lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as UserRole,
      unitId: user.unitId,
      unitName: user.unit?.name ?? null,
      department: user.department,
    };

    const token = await signSession(sessionUser);
    try {
      const cookieStore = cookies();
      cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    } catch {
      // Non-request context (e.g. test runner)
    }

    return {
      success: true,
      redirectTo: '/',
      user: sessionUser,
      token,
    };
  } catch (err: any) {
    console.error('Error in quickLogin:', err);
    return { success: false, error: err.message || 'Lỗi khi đăng nhập nhanh' };
  }
}

/**
 * Logout action: clears the sowasuco_session cookie.
 */
export async function logout(): Promise<{ success: boolean; redirectTo: string }> {
  try {
    const cookieStore = cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // Non-request context (e.g. test runner)
  }
  return { success: true, redirectTo: '/login' };
}


/**
 * Switch role action for Header Quick Role Switcher (R3).
 * Instantly re-issues session token for selected role without re-entering password.
 */
export async function switchRole(role: UserRole): Promise<AuthResult> {
  try {
    // Permission check: Only Admin (or Admin who has switched role) can switch roles
    const currentSession = await getSessionUser();
    if (currentSession) {
      const isAdmin = currentSession.role === 'admin' || currentSession.originalRole === 'admin';
      if (!isAdmin) {
        return {
          success: false,
          error: 'Chỉ có duy nhất tài khoản Quản trị viên (Admin) mới có quyền chuyển đổi vai trò.',
        };
      }
    }

    const persona = DEMO_PERSONAS[role];
    let user = null;

    if (persona) {
      user = await prisma.user.findUnique({
        where: { email: persona.email },
        include: { unit: true },
      });
    }

    if (!user) {
      user = await prisma.user.findFirst({
        where: { role, isActive: true },
        include: { unit: true },
      });
    }

    if (!user) {
      return { success: false, error: `Không tìm thấy người dùng cho vai trò ${role}` };
    }

    const effectiveOriginalRole: UserRole =
      currentSession?.originalRole || 'admin';

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as UserRole,
      unitId: user.unitId,
      unitName: user.unit?.name ?? null,
      department: user.department,
      originalRole: effectiveOriginalRole,
    };

    const token = await signSession(sessionUser);
    try {
      const cookieStore = cookies();
      cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    } catch {
      // Non-request context (e.g. test runner)
    }

    return { success: true, user: sessionUser, token };
  } catch (err: any) {
    console.error('Error in switchRole:', err);
    return { success: false, error: err.message || 'Lỗi khi chuyển đổi vai trò' };
  }
}

/**
 * Get current session user directly from Server Action.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  return await getSessionUser();
}
