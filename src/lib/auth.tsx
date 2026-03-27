/**
 * Auth Provider - SALÃO CASHBACK (FIXED)
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useCallback,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAutomation } from "@/hooks/useAutomation";
import {
  logAuthStart,
  logAuthValidate,
  logAuthRole,
  logAuthError,
  logAuthSuccess,
  logSessionRefresh,
  logRoleAssignment,
  logRoleBootstrap,
  logCriticalError,
  logLoadComplete,
} from "@/lib/debug/auth-logger";
import {
  validateSession,
  clearLocalStorageToken,
} from "@/lib/debug/session-validator";
import {
  getDashboardForRole,
  getLoginForRoute,
  ROLE_PRIORITY,
} from "@/lib/route-config";

export type AppRole =
  | "cliente"
  | "dono"
  | "profissional"
  | "afiliado_barbearia"
  | "afiliado_saas"
  | "contador"
  | "super_admin";

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

interface Barbershop {
  id: string;
  name: string;
  owner_user_id: string;
  owner_id?: string;
  sector?: string | null;
  specialty?: string | null;
  onboarding_status?: string;
  booking_policies?: any;
  [key: string]: any;
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
  barbershop: Barbershop | null;
  roles: AppRole[];
  loading: boolean;
  profileLoading: boolean;
  initialLoadComplete: boolean;
  authResolved: boolean;
  signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithWhatsApp: (whatsapp: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string, returnPath?: string) => Promise<{ error: Error | null }>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  getPrimaryRole: () => AppRole | null;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);

  const roleBootstrapAttemptedRef = useRef(false);
  const loadInFlightRef = useRef<string | null>(null);
  const userLoadInFlightRef = useRef<Promise<AppRole[]> | null>(null);
  const userLoadInFlightUserIdRef = useRef<string | null>(null);
  const { updateUserTracking } = useAutomation();

  // ============================================
  // ROLE INFERENCE
  // ============================================

  const inferRoleFromEmail = useCallback((email: string | undefined | null): AppRole | null => {
    if (!email) return null;
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
  // DATA FETCHING - returns { profile, roles }
  // ============================================

  const fetchUserData = useCallback(async (userId: string): Promise<AppRole[]> => {
    console.log('[AUTH] Buscando dados do usuário:', userId);
    try {
      const [profileRes, rolesRes, barbershopRes] = await Promise.all([
        (supabase as any).from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        (supabase as any).from("user_roles").select("role").eq("user_id", userId),
        (supabase as any).from("barbershops").select("*").eq("owner_user_id", userId).maybeSingle(),
      ]);

      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (barbershopRes.data) setBarbershop(barbershopRes.data as unknown as Barbershop);

      const fetchedRoles = (rolesRes.data || []).map((r: any) => r.role as AppRole);
      console.log('[AUTH] Roles encontradas:', fetchedRoles);
      setRoles(fetchedRoles);

      if (fetchedRoles.length > 0) {
        logAuthRole({ role_detectado: fetchedRoles[0] });
      }
      return fetchedRoles;
    } catch (error) {
      console.error('[AUTH] Erro crítico no fetchUserData:', error);
      logCriticalError("fetchUserData", error);
      return [];
    }
  }, []);

  // ============================================
  // FULL USER LOAD (session -> profile -> roles)
  // ============================================

  const loadUserComplete = useCallback(async (sessionUser: User): Promise<AppRole[]> => {
    if (loadInFlightRef.current === sessionUser.id) return [];
    loadInFlightRef.current = sessionUser.id;
    setProfileLoading(true);

    try {
      let currentRoles = await fetchUserData(sessionUser.id);

      // Bootstrap se sem roles
      if (currentRoles.length === 0 && !roleBootstrapAttemptedRef.current) {
        roleBootstrapAttemptedRef.current = true;
        try {
          console.log('[AUTH] Tentando bootstrap para usuário sem roles');
          await supabase.functions.invoke("bootstrap-role", {
            body: { user_id: sessionUser.id, email: sessionUser.email },
          });
          currentRoles = await fetchUserData(sessionUser.id);
        } catch (e) {
          console.warn('[AUTH] Bootstrap falhou:', e);
        }
      }

      logAuthSuccess({ user_id: sessionUser.id, roles: currentRoles });
    } finally {
      setProfileLoading(false);
      loadInFlightRef.current = null;
    }
  }, [fetchUserData]);

  useEffect(() => {
    let isMounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!isMounted) return;
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        void loadUserComplete(currentSession.user);
      } else {
        setProfile(null);
        setRoles([]);
        setBarbershop(null);
        loadInFlightRef.current = null;
      }
    });

    const initializeAuth = async () => {
      console.log('[AUTH] Inicializando autenticação...');
      const safetyTimer = setTimeout(() => {
        if (isMounted) {
          console.error('[AUTH] Safety timeout - forçando auth resolved');
          setLoading(false);
          setProfileLoading(false);
          setInitialLoadComplete(true);
          setAuthResolved(true);
        }
      }, 15000);

    const init = async () => {
      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        if (error) logAuthError("getSession failed", { error: error.message });
        if (!isMounted) return;

        logAuthStart({ token_existe: !!existingSession?.access_token });
        setSession(existingSession);
        setUser(existingSession?.user ?? null);

        if (existingSession?.user) {
          await loadUserComplete(existingSession.user);
        }
      } catch (err) {
        logCriticalError("initializeAuth", err);
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimer);
          setLoading(false);
          setInitialLoadComplete(true);
          setAuthResolved(true);
        }
      }
    }; // fim de init

    init();
    }; // fim de initializeAuth

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp = async (email: string, password: string, metadata: SignUpMetadata) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name: metadata.name, role: metadata.role } }
    });
    return { error, needsConfirmation: !data.session };
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        logAuthError("Login failed", { error: error.message });
        return { error };
      }
      
      // Atualizar tracking de inatividade após login bem-sucedido
      if (!error) {
        try {
          await updateUserTracking();
        } catch (trackingErr) {
          console.warn('Erro ao atualizar tracking (não crítico):', trackingErr);
          // Não bloquear o login se tracking falhar
        }
      }
      
      return { error: null };
    } catch (err) {
      logCriticalError("signIn", err);
      return { error: err as Error };
    }
  };

  const signInWithWhatsApp = async (whatsapp: string, password: string) => {
    try {
      const normalizedWhatsApp = whatsapp.replace(/\D/g, '');

      // Tenta buscar email por WhatsApp usando RPC
      let email = null;
      try {
        email = await supabase.rpc("get_email_by_whatsapp", { _whatsapp: normalizedWhatsApp });
      } catch (error) {
        console.warn('[AUTH] Função RPC get_email_by_whatsapp não encontrada, tentando fallback:', error);
        
        // Fallback: buscar diretamente na tabela profiles (pode falhar por RLS)
        try {
          const { data } = await supabase
            .from("profiles")
            .select("email")
            .eq("whatsapp", normalizedWhatsApp)
            .maybeSingle();
          
          email = data?.email;
        } catch (fallbackError) {
          console.warn('[AUTH] Fallback também falhou:', fallbackError);
        }
      }

      if (!email) {
        const error = new Error("WhatsApp não encontrado. Verifique o número ou crie uma conta.");
        logAuthError("WhatsApp login - user not found", { whatsapp: normalizedWhatsApp });
        return { error };
      }

      return signIn(email, password);
    } catch (err) {
      logCriticalError("signInWithWhatsApp", err);
      return { error: err as Error };
    }
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error };
  };

  const sendPasswordResetEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const hasRole = useCallback((role: AppRole): boolean => {
    return roles.includes(role);
  }, [roles]);

  const refreshSession = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.refreshSession();
    if (s) {
      setSession(s);
      setUser(s.user);
    }
  }, []);

  const getPrimaryRole = useCallback((): AppRole | null => {
    if (roles.length === 0) return null;
    const sortedRoles = [...roles].sort((a, b) => ROLE_PRIORITY[a] - ROLE_PRIORITY[b]);
    return sortedRoles[0];
  }, [roles]);

  const value = {
    user,
    session,
    profile,
    barbershop,
    roles,
    loading,
    profileLoading,
    initialLoadComplete,
    authResolved,
    signUp,
    signIn,
    signInWithWhatsApp,
    signInWithMagicLink,
    sendPasswordResetEmail,
    signOut,
    hasRole,
    getPrimaryRole,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { getDashboardForRole, getLoginForRoute } from "@/lib/route-config";
