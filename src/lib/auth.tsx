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
  owner_id: string;
  sector: string | null;
  specialty: string | null;
  onboarding_status: string;
  booking_policies: any;
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

  const loadInFlightRef = useRef<string | null>(null);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const [profileRes, rolesRes, barbershopRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("barbershops").select("*").eq("owner_id", userId).maybeSingle(),
      ]);

      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (barbershopRes.data) setBarbershop(barbershopRes.data as Barbershop);
      
      const fetchedRoles = rolesRes.data?.map(r => r.role as AppRole) || [];
      setRoles(fetchedRoles);
      return fetchedRoles;
    } catch (err) {
      console.error("fetchUserData error:", err);
      return [];
    }
  }, []);

  const loadUserComplete = useCallback(async (sessionUser: User) => {
    if (loadInFlightRef.current === sessionUser.id) return;
    loadInFlightRef.current = sessionUser.id;
    setProfileLoading(true);

    try {
      let currentRoles = await fetchUserData(sessionUser.id);

      // Simple bootstrap if no roles
      if (currentRoles.length === 0) {
        await supabase.functions.invoke("bootstrap-role", {
          body: { user_id: sessionUser.id, email: sessionUser.email },
        });
        currentRoles = await fetchUserData(sessionUser.id);
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
      }
    });

    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          await loadUserComplete(s.user);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialLoadComplete(true);
          setAuthResolved(true);
        }
      }
    };

    init();
    return () => { isMounted = false; subscription.unsubscribe(); };
  }, [loadUserComplete]);

  const signUp = async (email: string, password: string, metadata: SignUpMetadata) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name: metadata.name, role: metadata.role } }
    });
    return { error, needsConfirmation: !data.session };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithWhatsApp = async (whatsapp: string, password: string) => {
    const norm = whatsapp.replace(/\D/g, "");
    const { data: email } = await supabase.rpc("get_email_by_whatsapp", { _whatsapp: norm });
    if (!email) return { error: new Error("WhatsApp não encontrado") };
    return signIn(email, password);
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
