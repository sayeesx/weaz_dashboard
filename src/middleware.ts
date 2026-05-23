import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
  '/dashboard', '/orders', '/products', '/customers', '/delivery',
  '/inventory', '/analytics', '/finance', '/marketing', '/support',
  '/settings', '/system', '/ops', '/flags', '/ai',
  '/live', '/dispatch', '/incidents',
  '/catalog', '/audit', '/experiments',
];

const ADMIN_ROLES = ['platform_admin', 'store_admin', 'support', 'analyst'];
const BLOCKED_ROLES = ['customer', 'delivery_partner'];

const ROUTE_ROLE_MAP: Record<string, string[]> = {
  '/live':        ['platform_admin', 'store_admin'],
  '/dispatch':    ['platform_admin', 'store_admin'],
  '/incidents':   ['platform_admin', 'store_admin', 'support'],
  '/dashboard':   ['platform_admin', 'store_admin', 'support', 'analyst'],
  '/orders':      ['platform_admin', 'store_admin', 'support'],
  '/products':    ['platform_admin', 'store_admin'],
  '/catalog':     ['platform_admin', 'store_admin'],
  '/customers':   ['platform_admin', 'store_admin', 'support'],
  '/delivery':    ['platform_admin', 'store_admin'],
  '/inventory':   ['platform_admin', 'store_admin'],
  '/analytics':   ['platform_admin', 'analyst'],
  '/finance':     ['platform_admin'],
  '/marketing':   ['platform_admin', 'store_admin'],
  '/support':     ['platform_admin', 'support'],
  '/settings':    ['platform_admin'],
  '/system':      ['platform_admin'],
  '/ops':         ['platform_admin'],
  '/flags':       ['platform_admin'],
  '/ai':          ['platform_admin', 'analyst'],
  '/audit':       ['platform_admin'],
  '/experiments': ['platform_admin', 'analyst'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wsijroiugekjasrruvzf.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_key';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  
  if (!isProtected && pathname !== '/' && pathname !== '/auth/login') {
    return supabaseResponse;
  }

  if (!user && pathname !== '/auth/login') {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!user) {
    return supabaseResponse;
  }

  // User is authenticated, check roles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = profile?.role || 'customer';

  if (BLOCKED_ROLES.includes(userRole) || !ADMIN_ROLES.includes(userRole)) {
    if (pathname !== '/auth/unauthorized') {
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }
    return supabaseResponse;
  }

  const baseRoute = '/' + pathname.split('/').filter(Boolean)[0];
  const allowedRoles = ROUTE_ROLE_MAP[baseRoute];

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  supabaseResponse.headers.set('x-user-role', userRole);
  supabaseResponse.headers.set('x-user-id', user.id);

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
