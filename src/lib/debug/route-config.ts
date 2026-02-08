/**
 * Route Configuration
 * Mapa de rotas por perfil de usuário
 */

import { AppRole } from "@/lib/auth";

interface RouteConfig {
  path: string;
  allowedRoles: AppRole[];
  isPublic?: boolean;
  loginPath?: string;
}

// Rotas por perfil de usuário
export const ROLE_ROUTES: Record<AppRole, string[]> = {
  cliente: ['/app/cliente'],
  dono: ['/app/dashboard'],
  profissional: ['/app/profissional/dashboard'],
  afiliado_barbearia: ['/app/cliente'],
  afiliado_saas: ['/afiliado-saas/dashboard'],
  contador: ['/contador2026/dashboard'],
  super_admin: ['/admin/dashboard'],
};

// Dashboard principal por role
export const ROLE_DASHBOARD: Record<AppRole, string> = {
  cliente: '/app/cliente',
  dono: '/app/dashboard',
  profissional: '/app/profissional/dashboard',
  afiliado_barbearia: '/app/cliente',
  afiliado_saas: '/afiliado-saas/dashboard',
  contador: '/contador2026/dashboard',
  super_admin: '/admin/dashboard',
};

// Login path por role
export const ROLE_LOGIN_PATH: Record<AppRole, string> = {
  cliente: '/public/login',
  dono: '/public/login',
  profissional: '/public/login',
  afiliado_barbearia: '/public/login',
  afiliado_saas: '/afiliado-saas/login',
  contador: '/contador2026/login',
  super_admin: '/admin/login',
};

// Rotas públicas que não requerem autenticação
export const PUBLIC_ROUTES = [
  '/',
  '/public/login',
  '/public/404',
  '/afiliado-saas/login',
  '/contador2026/login',
  '/admin/login',
  '/auth',
];

// Rotas protegidas e seus roles permitidos
export const PROTECTED_ROUTES: RouteConfig[] = [
  // App routes
  { path: '/app/dashboard', allowedRoles: ['dono'] },
  { path: '/app/cliente', allowedRoles: ['cliente', 'afiliado_barbearia'] },
  { path: '/app/profissional/dashboard', allowedRoles: ['profissional'] },
  // Afiliado SaaS
  { path: '/afiliado-saas/dashboard', allowedRoles: ['afiliado_saas'] },
  // Contador
  { path: '/contador2026/dashboard', allowedRoles: ['contador'] },
  // Admin
  { path: '/admin/dashboard', allowedRoles: ['super_admin'] },
];

/**
 * Verifica se uma rota existe no sistema
 */
export function routeExists(pathname: string): boolean {
  // Check public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return true;
  }
  
  // Check protected routes
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route.path))) {
    return true;
  }
  
  // Check legacy redirects
  const legacyPaths = ['/cliente', '/dono', '/profissional', '/afiliado', '/contador'];
  if (legacyPaths.some(path => pathname.startsWith(path))) {
    return true;
  }
  
  return false;
}

/**
 * Verifica se um role tem permissão para acessar uma rota
 */
export function roleCanAccessRoute(pathname: string, roles: AppRole[]): boolean {
  const route = PROTECTED_ROUTES.find(r => pathname.startsWith(r.path));
  
  if (!route) {
    // Se não é uma rota protegida definida, verifica PUBLIC_ROUTES
    return PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
  }
  
  return route.allowedRoles.some(allowedRole => roles.includes(allowedRole));
}

/**
 * Retorna o caminho de login apropriado baseado na rota atual
 */
export function getLoginPathFromRoute(pathname: string): string {
  if (pathname.startsWith('/admin')) return '/admin/login';
  if (pathname.startsWith('/contador2026')) return '/contador2026/login';
  if (pathname.startsWith('/afiliado-saas')) return '/afiliado-saas/login';
  return '/public/login';
}

/**
 * Retorna o dashboard apropriado para um role
 */
export function getDashboardForRole(role: AppRole | null): string {
  if (!role) return '/public/login';
  return ROLE_DASHBOARD[role] || '/public/login';
}

/**
 * Verifica se uma rota é pública
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    pathname === route || 
    (route !== '/' && pathname.startsWith(route + '/')) ||
    pathname === route
  );
}

/**
 * Verifica se uma rota é de login
 */
export function isLoginRoute(pathname: string): boolean {
  const loginRoutes = ['/public/login', '/afiliado-saas/login', '/contador2026/login', '/admin/login', '/auth'];
  return loginRoutes.includes(pathname);
}
