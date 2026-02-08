import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Pega o cookie de sessão do NextAuth
  const sessionToken = request.cookies.get('authjs.session-token') || 
                       request.cookies.get('__Secure-authjs.session-token');
  
  const isLoggedIn = !!sessionToken;
  
  // Se está logado e tenta acessar login/register, redireciona para dashboard
  if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/rpgs', request.url));
  }
  
  // Se não está logado e tenta acessar dashboard, redireciona para login
  if (!isLoggedIn && pathname.startsWith('/rpgs')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
