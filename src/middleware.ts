import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    const notFoundUrl = new URL('/not-found', req.url);

    // Redirecionar root para dashboard se autenticado
    if (path === '/' && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Evita mostrar o login novamente para quem ja esta autenticado
    if (path.startsWith('/login') && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Proteção de rotas por role
    const canAccessAdmin = token?.role === 'ADMIN' || token?.role === 'DEMO';
    const canAccessProfessor =
      token?.role === 'PROFESSOR' || token?.role === 'ADMIN' || token?.role === 'DEMO';

    if (path.startsWith('/admin') && !canAccessAdmin) {
      return NextResponse.redirect(notFoundUrl);
    }

    if (path.startsWith('/professor') && !canAccessProfessor) {
      return NextResponse.redirect(notFoundUrl);
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
