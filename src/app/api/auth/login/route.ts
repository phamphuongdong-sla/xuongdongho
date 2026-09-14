import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { signSession, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/session';
import type { SessionUser, UserRole } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    let email = '';
    let password = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      email = (body.email || '').toString().trim().toLowerCase();
      password = (body.password || '').toString();
    } else {
      const formData = await req.formData();
      email = (formData.get('email') || '').toString().trim().toLowerCase();
      password = (formData.get('password') || '').toString();
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập đầy đủ Email và Mật khẩu' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { unit: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Tài khoản không tồn tại hoặc đã bị khóa' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // Update lastLogin
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    } catch (e) {
      console.warn('Failed to update lastLogin:', e);
    }

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

    const response = NextResponse.json({
      success: true,
      redirectTo: '/',
      user: sessionUser,
      token,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

    return response;
  } catch (err: any) {
    console.error('Error in API /api/auth/login:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi hệ thống trong quá trình đăng nhập' },
      { status: 500 }
    );
  }
}
