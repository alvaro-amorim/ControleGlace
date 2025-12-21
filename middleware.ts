import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Pega o cookie
  const token = request.cookies.get('glace_token')?.value;

  // Lista de páginas que NÃO precisam de login
  const publicPages = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/bg-confeitaria.png', '/telalogin.png', '/logo-glace.png'];
  
  // Se a página atual for pública, deixa passar
  if (publicPages.some(page => request.nextUrl.pathname.startsWith(page))) {
    return NextResponse.next();
  }

  // Se NÃO tiver token e tentar acessar página privada, chuta para o login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se tiver token e tentar acessar login, manda pro Dashboard
  if (token && request.nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configura onde o middleware funciona (tudo, menos arquivos estáticos do next)
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};