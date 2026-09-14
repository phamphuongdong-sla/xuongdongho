import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/session';

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public static files with extensions (.svg, .png, .jpg, .jpeg, .gif, .webp, .xlsx, .pdf, .ico)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xlsx|pdf|ico)$).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Read session cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(sessionToken);

  // 2. Unauthenticated user handling
  if (!session) {
    // If requesting login page, allow through
    if (pathname === '/login') {
      return NextResponse.next();
    }

    // Redirect unauthenticated requests to /login with sanitized callbackUrl
    const loginUrl = new URL('/login', request.url);
    const callbackPath = `${pathname}${search}`;
    // Sanitize callbackUrl: must be relative path starting with single /
    if (callbackPath.startsWith('/') && !callbackPath.startsWith('//')) {
      loginUrl.searchParams.set('callbackUrl', callbackPath);
    }

    return NextResponse.redirect(loginUrl);
  }

  // 3. Authenticated user visiting /login -> redirect to / or callbackUrl
  if (pathname === '/login') {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
    if (callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
      return NextResponse.redirect(new URL(callbackUrl, request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. Role-based Route Protection: /admin/* requires role === 'admin' or 'kho'
  if (pathname.startsWith('/admin')) {
    if (session.role !== 'admin' && session.role !== 'kho') {
      // Forbidden for non-admin/non-kho roles: redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 5. Forward user identity headers downstream to Server Components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', String(session.id));
  requestHeaders.set('x-user-role', session.role);
  requestHeaders.set('x-user-email', session.email);
  requestHeaders.set('x-user-unit-id', String(session.unitId ?? ''));
  requestHeaders.set('x-user-name', encodeURIComponent(session.fullName));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
