/**
 * Route Config - FONTE DE VERDADE para rotas e permissões
 * 
 * Regras:
 * - Nenhum redirect sem authResolved = true
 * - Rotas públicas: sem proteção
 * - Rotas protegidas: validação por role
 */

import type { AppRole } from "@/lib/auth";

// ============================================
// DASHBOARD POR ROLE
// ============================================

export const ROLE_DASHBOARD: Record<AppRole, string> = {
  cliente: '/app',
  dono: '/painel-dono',
  profissional: '/painel-profissional',
  afiliado_barbearia: '/app',
  afiliado_saas: '/afiliado-saas',
  contador: '/contador2026',
  super_admin: '/admin',
};

// ============================================
// LOGIN POR CONTEXTO DE ROTA
// ============================================

const LOGIN_MAP: [prefix: string, login: string][] = [
  ['/admin', '/super-admin2026ok'],
  ['/contador2026', '/contador2026/login'],
  ['/afiliado-saas', '/afiliado-saas/login'],
];

export function getLoginForRoute(pathname: string): string {
  for (const [prefix, login] of LOGIN_MAP) {
    if (pathname.startsWith(prefix)) return login;
  }
  return '/login';
}

// ============================================
// ROTAS PÚBLICAS (sem autenticação)
// ============================================

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/cadastro',
  '/afiliado-saas/login',
  '/afiliado-saas/cadastro',
  '/contador2026/login',
  '/super-admin2026ok',
  '/404',
]);

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

// ============================================
// ROTAS DE LOGIN (para evitar loops)
// ============================================

const LOGIN_PATHS = new Set([
  '/login',
  '/afiliado-saas/login',
  '/contador2026/login',
  '/super-admin2026ok',
]);

export function isLoginRoute(pathname: string): boolean {
  return LOGIN_PATHS.has(pathname);
}

// ============================================
// MAPA DE PERMISSÕES
// ============================================

interface RoutePermission {
  prefix: string;
  roles: AppRole[];
}

const PROTECTED_ROUTES: RoutePermission[] = [
  { prefix: '/admin', roles: ['super_admin'] },
  { prefix: '/contador2026', roles: ['contador'] },
  { prefix: '/afiliado-saas', roles: ['afiliado_saas'] },
  { prefix: '/painel-dono', roles: ['dono'] },
  { prefix: '/painel-profissional', roles: ['profissional'] },
  { prefix: '/app', roles: ['cliente', 'afiliado_barbearia'] },
];

export function getAllowedRolesForRoute(pathname: string): AppRole[] | null {
  // Login routes within protected areas are public
  if (isLoginRoute(pathname)) return null;
  
  const match = PROTECTED_ROUTES.find(r => 
    pathname === r.prefix || pathname.startsWith(r.prefix + '/')
  );
  return match?.roles ?? null;
}

// ============================================
// HELPERS
// ============================================

export function getDashboardForRole(role: AppRole | null): string {
  if (!role) return '/login';
  return ROLE_DASHBOARD[role] || '/login';
}

export function getLoginForRole(role: AppRole | null): string {
  if (!role) return '/login';
  const dashboard = ROLE_DASHBOARD[role];
  return getLoginForRoute(dashboard);
}

// ============================================
// ROLE PRIORITY (para getPrimaryRole)
// ============================================

export const ROLE_PRIORITY: AppRole[] = [
  'super_admin', 'contador', 'dono', 'profissional',
  'afiliado_saas', 'afiliado_barbearia', 'cliente',
];
