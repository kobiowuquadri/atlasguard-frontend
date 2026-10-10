import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? 'ag_session';
const PROTECTED_PREFIXES = [
  '/overview',
  '/projects',
  '/benchmarks',
  '/evaluations',
  '/insights',
  '/reports',
  '/developer',
  '/settings',
  '/feedback',
];

/**
 * Route protection: dashboard routes require a session cookie. The API validates the
 * session on every request; an invalid cookie is cleared client-side via /auth/logout.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)'],
};
