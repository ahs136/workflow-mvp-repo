import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create Supabase client bound to the request/response
  const supabase = createMiddlewareClient({ req, res });

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  // Public routes that don't require auth
  const publicPaths = ['/', '/about', '/api/auth/callback'];

  if (publicPaths.includes(pathname)) {
    return res;
  }

  // If no session (user not signed in) redirect to landing page
  if (!session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  // Otherwise, continue with the request
  return res;
}

export const config = {
  matcher: ['/((?!api/auth/callback|about|_next|favicon.ico).*)'],
};
