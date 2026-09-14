import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, DEMO_PERSONAS } from '@/lib/auth';
import { signSession, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/session';
import type { SessionUser, UserRole } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const currentSession = await getSessionUser();
    if (!currentSession) {
      return NextResponse.json(
        { success: false, error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn' },
        { status: 401 }
      );
    }

    // Strict Permission: Only Admin (or Admin who has switched role) can switch roles
    const isAdmin = currentSession.role === 'admin' || currentSession.originalRole === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Chỉ có duy nhất tài khoản Quản trị viên (Admin) mới có quyền chuyển đổi vai trò.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const role = body.role as UserRole;
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Thiếu vai trò mục tiêu cần chuyển đổi' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { success: false, error: `Không tìm thấy người dùng cho vai trò ${role}` },
        { status: 404 }
      );
    }

    const effectiveOriginalRole: UserRole =
      currentSession.originalRole || (currentSession.role === 'admin' ? 'admin' : 'admin');

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
    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      token,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (err: any) {
    console.error('Error in /api/auth/switch-role:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi khi chuyển đổi vai trò' },
      { status: 500 }
    );
  }
}
