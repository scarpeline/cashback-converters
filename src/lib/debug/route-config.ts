/**
 * Route Configuration - SALÃO CASHBACK
 * Mapa centralizado de rotas por perfil de usuário
 * 
 * Este arquivo é a fonte de verdade para:
 * - Dashboards por perfil
 * - Rotas de login por perfil
 * - Validação de acesso a rotas
 * - Redirecionamentos
 * 
 * REGRA ABSOLUTA:
 * - Nunca remover sessão ativa
 * - Nunca redirecionar sem validar role
 */

import type { AppRole } from "@/lib/auth";

interface RouteConfig {
  path: string;
  allowedRoles: AppRole[];
  isPublic?: boolean;
  loginPath?: string;
}

/**
 * Dashboard principal por role - FONTE DE VERDADE para redirecionamentos
 * ATUALIZADO conforme spec do usuário
 */
export const ROLE_DASHBOARD: Record<AppRole, string> = {
  cliente: '/app',
  dono: '/painel-dono',
  profissional: '/painel-profissional',
  afiliado_barbearia: '/app',
  afiliado_saas: '/afiliado-saas',
  contador: '/contador2026',
  super_admin: '/admin',
};

/**
 * Rotas permitidas por perfil de usuário (inclui sub-rotas)
 */
export const ROLE_ROUTES: Record<AppRole, string[]> = {
  cliente: ['/app'],
  dono: ['/painel-dono'],
  profissional: ['/painel-profissional'],
  afiliado_barbearia: ['/app'],
  afiliado_saas: ['/afiliado-saas'],
  contador: ['/contador2026'],
  super_admin: ['/admin'],
};

/**
 * Login path por role - onde redirecionar para fazer login
 */
export const ROLE_LOGIN_PATH: Record<AppRole, string> = {
  cliente: '/login',
  dono: '/login',
  profissional: '/login',
  afiliado_barbearia: '/login',
  afiliado_saas: '/afiliado-saas/login',
  contador: '/contador2026/login',
  super_admin: '/admin/login',
};

/**
 * Rotas públicas que não requerem autenticação
 */
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/cadastro',
  '/afiliado-saas/login',
  '/afiliado-saas/cadastro',
  '/contador2026/login',
  '/admin/login',
  '/404',
  '/auth', // legacy
  '/public/login', // legacy
  '/public/404', // legacy
];

/**
 * Rotas de login - para evitar loops de redirecionamento
 */
export const LOGIN_ROUTES = [
  '/login',
  '/afiliado-saas/login',
  '/contador2026/login',
  '/admin/login',
  '/auth', // legacy
  '/public/login', // legacy
];

/**
 * Rotas protegidas e seus roles permitidos
 */
export const PROTECTED_ROUTES: RouteConfig[] = [
  // Cliente
  { path: '/app', allowedRoles: ['cliente', 'afiliado_barbearia'] },
  
  // Dono de Barbearia
  { path: '/painel-dono', allowedRoles: ['dono'] },
  
  // Profissional
  { path: '/painel-profissional', allowedRoles: ['profissional'] },
  
  // Afiliado SaaS
  { path: '/afiliado-saas', allowedRoles: ['afiliado_saas'] },
  
  // Contador
  { path: '/contador2026', allowedRoles: ['contador'] },
  
  // Admin
  { path: '/admin', allowedRoles: ['super_admin'] },
];

/**
 * Verifica se uma rota existe no sistema
 */
export function routeExists(pathname: string): boolean {
  // Check public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return true;
  }
  
  // Check protected routes (prefix match)
  if (PROTECTED_ROUTES.some(route => pathname === route.path || pathname.startsWith(route.path + '/'))) {
    return true;
  }
  
  // Check legacy redirects
  const legacyPaths = ['/cliente', '/dono', '/profissional', '/afiliado', '/public'];
  if (legacyPaths.some(path => pathname.startsWith(path))) {
    return true;
  }
  
  return false;
}

/**
 * Verifica se um role tem permissão para acessar uma rota
 */
export function roleCanAccessRoute(pathname: string, roles: AppRole[]): boolean {
  // Find matching protected route
  const route = PROTECTED_ROUTES.find(r => pathname === r.path || pathname.startsWith(r.path + '/'));
  
  if (!route) {
    // Se não é uma rota protegida definida, verifica PUBLIC_ROUTES
    return PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
  }
  
  // Check if any user role matches allowed roles
  return route.allowedRoles.some(allowedRole => roles.includes(allowedRole));
}

/**
 * Retorna o caminho de login apropriado baseado na rota atual
 * Usado para redirecionar usuários não autenticados
 */
export function getLoginPathFromRoute(pathname: string): string {
  if (pathname.startsWith('/admin')) return '/admin/login';
  if (pathname.startsWith('/contador2026')) return '/contador2026/login';
  if (pathname.startsWith('/afiliado-saas')) return '/afiliado-saas/login';
  return '/login';
}

/**
 * Retorna o dashboard apropriado para um role
 * Esta é a função principal para redirecionamentos pós-login
 */
export function getDashboardForRole(role: AppRole | null): string {
  if (!role) return '/login';
  return ROLE_DASHBOARD[role] || '/login';
}

/**
 * Verifica se uma rota é pública
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    pathname === route || 
    (route !== '/' && pathname.startsWith(route + '/'))
  );
}

/**
 * Verifica se uma rota é de login
 * Usado para prevenir loops de redirecionamento
 */
export function isLoginRoute(pathname: string): boolean {
  return LOGIN_ROUTES.some(route => pathname === route);
}

/**
 * Retorna o login path apropriado para um role específico
 * Usado para logout contextual
 */
export function getLoginPathForRole(role: AppRole | null): string {
  if (!role) return '/login';
  return ROLE_LOGIN_PATH[role] || '/login';
}

/**
 * Obtém a rota de entrada para um role (sem /login ou /dashboard suffix)
 */
export function getEntryPathForRole(role: AppRole | null): string {
  if (!role) return '/login';
  return ROLE_DASHBOARD[role] || '/login';
}
