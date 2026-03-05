import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow public routes
  const publicPaths = ['/', '/sign-in', '/sign-up'];
  if (publicPaths.some(path => request.nextUrl.pathname === path)) {
    return NextResponse.next();
  }

  // For now, allow all requests through
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
