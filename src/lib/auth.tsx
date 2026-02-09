/**
 * Auth Provider - SALÃO CASHBACK
 * 
 * Sistema de autenticação integrado com Supabase
 * 
 * REGRAS ABSOLUTAS:
 * - Nunca remover sessão ativa
 * - Nunca redirecionar sem validar role
 * - Sessão persistente com refresh token automático
 * - Logs obrigatórios para erros de auth, redirect e sessão
 */

import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { 
  logAuthStart, 
  logAuthValidate, 
  logAuthRole, 
  logAuthError,
  logAuthSuccess,
  logSessionExpired,
  logSessionRefresh,
  logRoleAssignment,
  logRoleBootstrap,
  logDebugSummary,
  logCriticalError,
  logLoadComplete
} from "@/lib/debug/auth-logger";
import { validateSession, clearLocalStorageToken } from "@/lib/debug/session-validator";
import { getDashboardForRole, getLoginPathFromRoute } from "@/lib/debug/route-config";

// ============================================
// TYPES
// ============================================

export type AppRole = 'cliente' | 'dono' | 'profissional' | 'afiliado_barbearia' | 'afiliado_saas' | 'contador' | 'super_admin';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  whatsapp: string | null;
  email: string | null;
  cpf_cnpj: string | null;
  pix_key: string | null;
  avatar_url: string | null;
}

interface SignUpMetadata {
  name: string;
  whatsapp?: string;
  role: AppRole;
  cpf_cnpj?: string;
  pix_key?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  initialLoadComplete: boolean;
  signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithWhatsApp: (whatsapp: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  getPrimaryRole: () => AppRole | null;
  refreshSession: () => Promise<void>;
}

// ============================================
// CONSTANTS
// ============================================

const PENDING_ROLE_STORAGE_KEY = "scb_pending_role";
const PENDING_ROLE_USER_KEY = "scb_pending_role_user_id";
const SELF_ASSIGNABLE_ROLES: AppRole[] = ["cliente", "dono", "afiliado_saas"];

// Priority order for dashboard routing
const ROLE_PRIORITY: AppRole[] = [
  'super_admin', 
  'contador', 
  'dono', 
  'profissional', 
  'afiliado_saas', 
  'afiliado_barbearia', 
  'cliente'
];

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  const initRef = useRef(false);
  const roleBootstrapAttemptedRef = useRef(false);

  // ============================================
  // PENDING ROLE STORAGE (for post-confirmation assignment)
  // ============================================

  const rememberPendingRole = useCallback((userId: string, role: AppRole) => {
    if (!SELF_ASSIGNABLE_ROLES.includes(role)) return;
    try {
      localStorage.setItem(PENDING_ROLE_STORAGE_KEY, role);
      localStorage.setItem(PENDING_ROLE_USER_KEY, userId);
    } catch {
      // Storage not available
    }
  }, []);

  const consumePendingRole = useCallback((userId: string): AppRole | null => {
    try {
      const storedUserId = localStorage.getItem(PENDING_ROLE_USER_KEY);
      const storedRole = localStorage.getItem(PENDING_ROLE_STORAGE_KEY) as AppRole | null;

      if (storedUserId === userId && storedRole && SELF_ASSIGNABLE_ROLES.includes(storedRole)) {
        localStorage.removeItem(PENDING_ROLE_USER_KEY);
        localStorage.removeItem(PENDING_ROLE_STORAGE_KEY);
        return storedRole;
      }
    } catch {
      // Storage not available
    }
    return null;
  }, []);

  // ============================================
  // ROLE INFERENCE
  // ============================================

  const inferRoleFromEmail = useCallback((email: string | undefined | null): AppRole | null => {
    if (!email) return null;
    // Clientes usam e-mail sintético baseado no WhatsApp
    if (email.endsWith("@salao.app")) return "cliente";
    return null;
  }, []);

  // ============================================
  // ROLE ASSIGNMENT
  // ============================================

  const ensureInitialRole = useCallback(async (sessionUser: User): Promise<AppRole | null> => {
    const pending = consumePendingRole(sessionUser.id);
    const inferred = inferRoleFromEmail(sessionUser.email);
    const roleToAssign = pending || inferred;

    if (!roleToAssign) return null;

    const { error } = await supabase.from("user_roles").insert({
      user_id: sessionUser.id,
      role: roleToAssign,
    });

    if (error) {
      const msg = (error.message || "").toLowerCase();
      // Ignore duplicate errors - role already exists
      if (!msg.includes("duplicate") && !msg.includes("already") && !msg.includes("unique")) {
        logAuthError("Initial role assignment failed", { error: error.message, role: roleToAssign });
        logRoleAssignment(sessionUser.id, roleToAssign, false);
        return null;
      }
    }

    logRoleAssignment(sessionUser.id, roleToAssign, true);
    logAuthRole({ role_detectado: roleToAssign });
    return roleToAssign;
  }, [consumePendingRole, inferRoleFromEmail]);

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchUserData = useCallback(async (userId: string): Promise<AppRole[]> => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        logAuthError("Failed to fetch profile", { error: profileError.message });
      } else if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) {
        logAuthError("Failed to fetch roles", { error: rolesError.message });
        return [];
      }

      const fetchedRoles = rolesData?.map(r => r.role as AppRole) || [];
      setRoles(fetchedRoles);
      
      if (fetchedRoles.length > 0) {
        logAuthRole({ role_detectado: fetchedRoles[0] });
      }
      
      return fetchedRoles;
    } catch (error) {
      logCriticalError("fetchUserData", error);
      return [];
    }
  }, []);

  // ============================================
  // ROLE BOOTSTRAP (via Edge Function)
  // ============================================

  const bootstrapRoles = useCallback(async (sessionUser: User) => {
    if (roleBootstrapAttemptedRef.current) return;
    roleBootstrapAttemptedRef.current = true;

    try {
      const { data, error } = await supabase.functions.invoke("bootstrap-role", {
        body: {
          user_id: sessionUser.id,
          email: sessionUser.email,
        },
      });

      if (error) {
        logAuthError("Role bootstrap failed", { error: error.message });
        logRoleBootstrap(sessionUser.id, null);
        return;
      }

      if (data?.role_assigned) {
        logRoleBootstrap(sessionUser.id, data.role_assigned);
        logAuthRole({ role_detectado: data.role_assigned as AppRole });
      }
    } catch (error) {
      logCriticalError("bootstrapRoles", error);
    }
  }, []);

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        logSessionRefresh(false);
        logAuthError("Session refresh failed", { error: error.message });
        return;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        logSessionRefresh(true);
      }
    } catch (error) {
      logCriticalError("refreshSession", error);
    }
  }, []);

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initRef.current) return;
    initRef.current = true;

    let isMounted = true;
    const startTime = Date.now();

    // Step 1: Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;

        logAuthStart({ token_existe: !!currentSession?.access_token, event });
        
        // Update state synchronously
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Validate session
        const validation = validateSession(currentSession);
        logAuthValidate({ token_valido: validation.isValid });

        // Handle session expiration
        if (validation.isExpired) {
          logSessionExpired({ 
            expires_at: validation.expiresAt || 'unknown',
            reason: validation.reason 
          });
        }

        // Defer Supabase calls with setTimeout to prevent deadlock
        if (currentSession?.user && validation.isValid) {
          setTimeout(async () => {
            if (!isMounted) return;

            let fetchedRoles = await fetchUserData(currentSession.user.id);

            // Self-heal: bootstrap roles if missing
            if (fetchedRoles.length === 0) {
              await bootstrapRoles(currentSession.user);
              fetchedRoles = await fetchUserData(currentSession.user.id);
            }

            // Try initial role assignment if still no roles
            if (fetchedRoles.length === 0) {
              const assigned = await ensureInitialRole(currentSession.user);
              if (assigned) {
                await fetchUserData(currentSession.user.id);
              }
            }

            logAuthSuccess({ 
              user_id: currentSession.user.id,
              roles: fetchedRoles 
            });
          }, 0);
        } else if (!currentSession) {
          // User logged out
          setProfile(null);
          setRoles([]);
          roleBootstrapAttemptedRef.current = false;
        }

        // Only set loading false on subsequent changes
        if (initialLoadComplete) {
          setLoading(false);
        }
      }
    );

    // Step 2: Check for existing session (INITIAL LOAD)
    const initializeAuth = async () => {
      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          logAuthError("getSession failed", { error: error.message });
        }

        if (!isMounted) return;

        logAuthStart({ token_existe: !!existingSession?.access_token });

        setSession(existingSession);
        setUser(existingSession?.user ?? null);

        // Validate session
        const validation = validateSession(existingSession);
        logAuthValidate({ token_valido: validation.isValid });

        if (validation.isExpired) {
          logSessionExpired({ 
            expires_at: validation.expiresAt || 'unknown',
            reason: validation.reason 
          });
        }

        // Fetch roles BEFORE setting loading false
        if (existingSession?.user && validation.isValid) {
          let fetchedRoles = await fetchUserData(existingSession.user.id);

          // Self-heal: bootstrap roles if missing
          if (fetchedRoles.length === 0) {
            await bootstrapRoles(existingSession.user);
            fetchedRoles = await fetchUserData(existingSession.user.id);
          }

          // Try initial role assignment if still no roles
          if (fetchedRoles.length === 0) {
            const assigned = await ensureInitialRole(existingSession.user);
            if (assigned) {
              fetchedRoles = await fetchUserData(existingSession.user.id);
            }
          }
          
          logDebugSummary('Initial Auth Complete', {
            user_id: existingSession.user.id,
            email: existingSession.user.email,
            roles: fetchedRoles,
            session_valid: validation.isValid,
          });
        }
      } catch (error) {
        logCriticalError("initializeAuth", error);
      } finally {
        if (isMounted) {
          const duration = Date.now() - startTime;
          logLoadComplete({ duration_ms: duration, status: 'liberado' });
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData, bootstrapRoles, ensureInitialRole]);

  // ============================================
  // AUTH METHODS
  // ============================================

  const signUp = async (email: string, password: string, metadata: SignUpMetadata) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: metadata.name,
            whatsapp: metadata.whatsapp || null,
          }
        }
      });

      if (error) {
        logAuthError("Signup failed", { error: error.message });
        return { error, needsConfirmation: false };
      }

      // Store pending role for post-confirmation assignment
      if (data.user) {
        rememberPendingRole(data.user.id, metadata.role);

        // Update profile with additional data (if user is confirmed)
        if (data.session && (metadata.cpf_cnpj || metadata.pix_key)) {
          await supabase
            .from("profiles")
            .update({
              cpf_cnpj: metadata.cpf_cnpj,
              pix_key: metadata.pix_key,
            })
            .eq("user_id", data.user.id);
        }
      }

      // Check if email confirmation is required
      const needsConfirmation = !data.session;
      
      return { error: null, needsConfirmation };
    } catch (err) {
      logCriticalError("signUp", err);
      return { error: err as Error, needsConfirmation: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logAuthError("Login failed", { error: error.message });
        return { error };
      }

      return { error: null };
    } catch (err) {
      logCriticalError("signIn", err);
      return { error: err as Error };
    }
  };

  const signInWithWhatsApp = async (whatsapp: string, password: string) => {
    try {
      // Normalize whatsapp - remove non-digits
      const normalizedWhatsApp = whatsapp.replace(/\D/g, '');
      
      // Find user by whatsapp in profiles
      const { data: profileData } = await supabase
        .from("profiles")
        .select("email, whatsapp")
        .or(`whatsapp.eq.${normalizedWhatsApp},whatsapp.eq.${whatsapp}`)
        .maybeSingle();

      if (!profileData?.email) {
        const error = new Error("WhatsApp não encontrado. Verifique o número ou crie uma conta.");
        logAuthError("WhatsApp login - user not found", { whatsapp: normalizedWhatsApp });
        return { error };
      }

      return signIn(profileData.email, password);
    } catch (err) {
      logCriticalError("signInWithWhatsApp", err);
      return { error: err as Error };
    }
  };

  const signInWithMagicLink = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        }
      });

      if (error) {
        logAuthError("Magic link failed", { error: error.message });
        return { error };
      }

      return { error: null };
    } catch (err) {
      logCriticalError("signInWithMagicLink", err);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      const currentPath = window.location.pathname;
      
      await supabase.auth.signOut();
      clearLocalStorageToken();
      
      setUser(null);
      setSession(null);
      setProfile(null);
      setRoles([]);
      roleBootstrapAttemptedRef.current = false;
      
      // Redirect to appropriate login page
      const loginPath = getLoginPathFromRoute(currentPath);
      window.location.href = loginPath;
    } catch (err) {
      logCriticalError("signOut", err);
    }
  };

  // ============================================
  // ROLE HELPERS
  // ============================================

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);

  const getPrimaryRole = useCallback((): AppRole | null => {
    for (const role of ROLE_PRIORITY) {
      if (roles.includes(role)) return role;
    }
    return null;
  }, [roles]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      roles,
      loading,
      initialLoadComplete,
      signUp,
      signIn,
      signInWithWhatsApp,
      signInWithMagicLink,
      signOut,
      hasRole,
      getPrimaryRole,
      refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ============================================
// RE-EXPORTS
// ============================================

export { getDashboardForRole, getLoginPathFromRoute, getLoginPathForRole } from "@/lib/debug/route-config";
