import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { 
  logAuthStart, 
  logAuthValidate, 
  logAuthRole, 
  logAuthError,
  logDebugSummary 
} from "@/lib/debug/auth-logger";
import { validateSession, clearLocalStorageToken } from "@/lib/debug/session-validator";
import { getDashboardForRole, getLoginPathFromRoute as getLoginPath } from "@/lib/debug/route-config";

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
  whatsapp: string;
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
  signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithWhatsApp: (whatsapp: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  getPrimaryRole: () => AppRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const initRef = useRef(false);
  const roleBootstrapAttemptedRef = useRef(false);

  const fetchUserData = async (userId: string): Promise<AppRole[]> => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileData) {
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
      
      logAuthRole({ role_detectado: fetchedRoles[0] || null });
      
      return fetchedRoles;
    } catch (error) {
      logAuthError("Failed to fetch user data", { error: String(error) });
      return [];
    }
  };

  /**
   * Auto-correção: se o usuário autenticou mas não tem role ainda,
   * tentamos “bootstrapar” pelo backend (seguro) e re-fetch.
   */
  const bootstrapRoles = async (sessionUser: User) => {
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
        return;
      }

      if (data?.role_assigned) {
        logAuthRole({ role_detectado: data.role_assigned as AppRole });
      }
    } catch (error) {
      logAuthError("Role bootstrap exception", { error: String(error) });
    }
  };

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initRef.current) return;
    initRef.current = true;

    let isMounted = true;

    // Step 1: Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;

        logAuthStart({ token_existe: !!currentSession?.access_token });
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Validate session
        const validation = validateSession(currentSession);
        logAuthValidate({ token_valido: validation.isValid });

        // Defer Supabase calls with setTimeout to prevent deadlock
        if (currentSession?.user && validation.isValid) {
          setTimeout(() => {
            if (!isMounted) return;

            (async () => {
              const fetchedRoles = await fetchUserData(currentSession.user.id);

              // Self-heal roles when missing (common cause of redirect-to-login)
              if (fetchedRoles.length === 0) {
                await bootstrapRoles(currentSession.user);
                await fetchUserData(currentSession.user.id);
              }
            })();
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          roleBootstrapAttemptedRef.current = false;
        }

        // Only set loading false on subsequent changes, not initial
        if (initialLoadComplete) {
          setLoading(false);
        }
      }
    );

    // Step 2: THEN check for existing session (INITIAL LOAD)
    const initializeAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        logAuthStart({ token_existe: !!existingSession?.access_token });

        setSession(existingSession);
        setUser(existingSession?.user ?? null);

        // Validate session
        const validation = validateSession(existingSession);
        logAuthValidate({ token_valido: validation.isValid });

        // Fetch roles BEFORE setting loading false
        if (existingSession?.user && validation.isValid) {
          let fetchedRoles = await fetchUserData(existingSession.user.id);

          // Self-heal roles (missing role row is the #1 cause of dashboard redirect)
          if (fetchedRoles.length === 0) {
            await bootstrapRoles(existingSession.user);
            fetchedRoles = await fetchUserData(existingSession.user.id);
          }
          
          logDebugSummary('Initial Auth Complete', {
            user_id: existingSession.user.id,
            email: existingSession.user.email,
            roles: fetchedRoles,
            session_valid: validation.isValid,
          });
        }
      } catch (error) {
        logAuthError("Initial auth failed", { error: String(error) });
      } finally {
        if (isMounted) {
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
  }, []);

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
            whatsapp: metadata.whatsapp,
          }
        }
      });

      if (error) {
        logAuthError("Signup failed", { error: error.message });
        return { error };
      }

      // After successful signup, assign role
      if (data.user) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: data.user.id,
            role: metadata.role
          });

        if (roleError) {
          logAuthError("Role assignment failed", { error: roleError.message });
        } else {
          // Update local state with the new role
          setRoles([metadata.role]);
          logAuthRole({ role_detectado: metadata.role });
        }

        // Update profile with additional data
        if (metadata.cpf_cnpj || metadata.pix_key) {
          await supabase
            .from("profiles")
            .update({
              cpf_cnpj: metadata.cpf_cnpj,
              pix_key: metadata.pix_key
            })
            .eq("user_id", data.user.id);
        }
      }

      return { error: null };
    } catch (err) {
      logAuthError("Signup exception", { error: String(err) });
      return { error: err as Error };
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
      logAuthError("Login exception", { error: String(err) });
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
        return { error: new Error("WhatsApp não encontrado. Verifique o número ou crie uma conta.") };
      }

      return signIn(profileData.email, password);
    } catch (err) {
      logAuthError("WhatsApp login failed", { error: String(err) });
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
      logAuthError("Magic link exception", { error: String(err) });
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    const currentPath = window.location.pathname;
    
    await supabase.auth.signOut();
    clearLocalStorageToken();
    
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    
    // Redirect to appropriate login page
    const loginPath = getLoginPath(currentPath);
    window.location.href = loginPath;
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  const getPrimaryRole = (): AppRole | null => {
    // Priority order for dashboard routing
    const priority: AppRole[] = ['super_admin', 'contador', 'dono', 'profissional', 'afiliado_saas', 'afiliado_barbearia', 'cliente'];
    for (const role of priority) {
      if (roles.includes(role)) return role;
    }
    return null;
  };

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
      getPrimaryRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Re-export helper functions from route-config
export { getDashboardForRole as getRedirectPath, getLoginPathFromRoute as getLoginPathForRole } from "@/lib/debug/route-config";
