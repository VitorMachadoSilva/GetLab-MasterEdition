import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Redirecionar root para dashboard se autenticado
    if (path === '/' && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Proteção de rotas por role
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (path.startsWith('/professor') && token?.role !== 'PROFESSOR' && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Permitir acesso ao login e display público sem autenticação
        const path = req.nextUrl.pathname;
        if (path.startsWith('/login') || path.startsWith('/display')) {
          return true;
        }
        
        // Outras rotas requerem autenticação
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/professor/:path*',
    '/admin/:path*',
    '/perfil/:path*',
  ],
};
