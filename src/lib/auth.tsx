/**
 * Auth Provider - SALÃO CASHBACK
 *
 * REGRAS:
 * - AUTH_START, SESSION_CHECK, AUTH_VALIDATE executam 1 vez (initial load)
 * - authResolved = false até sessão + roles estarem carregados
 * - Nenhum redirect ocorre até authResolved = true
 * - onAuthStateChange NÃO usa setTimeout
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
  logSessionExpired,
  logSessionRefresh,
  logRoleAssignment,
  logRoleBootstrap,
  logDebugSummary,
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

// ============================================
// TYPES
// ============================================

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
  profileLoading: boolean;
  initialLoadComplete: boolean;
  authResolved: boolean;
  signUp: (
    email: string,
    password: string,
    metadata: SignUpMetadata,
  ) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithWhatsApp: (
    whatsapp: string,
    password: string,
  ) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (
    email: string,
    returnPath?: string,
  ) => Promise<{ error: Error | null }>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: Error | null }>;
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

// ROLE_PRIORITY imported from route-config

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
  const [profileLoading, setProfileLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);

  const userLoadInFlightRef = useRef<Promise<AppRole[]> | null>(null);
  const userLoadInFlightUserIdRef = useRef<string | null>(null);

  // ============================================
  // PENDING ROLE STORAGE
  // ============================================

  const rememberPendingRole = useCallback((userId: string, role: AppRole) => {
    if (!SELF_ASSIGNABLE_ROLES.includes(role)) return;
    try {
      localStorage.setItem(PENDING_ROLE_STORAGE_KEY, role);
      localStorage.setItem(PENDING_ROLE_USER_KEY, userId);
    } catch {
      /* noop */
    }
  }, []);

  const consumePendingRole = useCallback((userId: string): AppRole | null => {
    try {
      const storedUserId = localStorage.getItem(PENDING_ROLE_USER_KEY);
      const storedRole = localStorage.getItem(
        PENDING_ROLE_STORAGE_KEY,
      ) as AppRole | null;
      if (
        storedUserId === userId &&
        storedRole &&
        SELF_ASSIGNABLE_ROLES.includes(storedRole)
      ) {
        localStorage.removeItem(PENDING_ROLE_USER_KEY);
        localStorage.removeItem(PENDING_ROLE_STORAGE_KEY);
        return storedRole;
      }
    } catch {
      /* noop */
    }
    return null;
  }, []);

  // ============================================
  // ROLE INFERENCE
  // ============================================

  const inferRoleFromEmail = useCallback(
    (email: string | undefined | null): AppRole | null => {
      if (!email) return null;
      if (email.endsWith("@salao.app")) return "cliente";
      return null;
    },
    [],
  );

  const inferRoleFromMetadata = useCallback(
    (rawRole: unknown): AppRole | null => {
      if (!rawRole || typeof rawRole !== "string") return null;
      const role = rawRole as AppRole;
      if (ROLE_PRIORITY.includes(role)) return role;
      return null;
    },
    [],
  );

  // ============================================
  // ROLE ASSIGNMENT
  // ============================================

  const ensureInitialRole = useCallback(
    async (sessionUser: User): Promise<AppRole | null> => {
      const pending = consumePendingRole(sessionUser.id);
      const metadataRole = inferRoleFromMetadata(
        sessionUser.user_metadata?.role,
      );
      const inferred = inferRoleFromEmail(sessionUser.email);
      const roleToAssign = pending || metadataRole || inferred;
      if (!roleToAssign) return null;

      const { error } = await supabase.from("user_roles").insert({
        user_id: sessionUser.id,
        role: roleToAssign,
      });

      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (
          !msg.includes("duplicate") &&
          !msg.includes("already") &&
          !msg.includes("unique")
        ) {
          logAuthError("Initial role assignment failed", {
            error: error.message,
            role: roleToAssign,
          });
          logRoleAssignment(sessionUser.id, roleToAssign, false);
          return null;
        }
      }

      logRoleAssignment(sessionUser.id, roleToAssign, true);
      logAuthRole({ role_detectado: roleToAssign });
      return roleToAssign;
    },
    [consumePendingRole, inferRoleFromMetadata, inferRoleFromEmail],
  );

  // ============================================
  // DATA FETCHING - returns { profile, roles }
  // ============================================

  const fetchUserData = useCallback(
    async (userId: string): Promise<AppRole[]> => {
      const controller = new AbortController();
      const safetyTimeout = setTimeout(() => controller.abort(), 15000); // 15s global timeout

      try {
        // Execute queries in parallel using the abort signal
        const [profileResult, rolesResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", userId),
        ]);

        clearTimeout(safetyTimeout);

        if (profileResult.error) {
          logAuthError("Failed to fetch profile", {
            error: profileResult.error.message,
          });
        } else if (profileResult.data) {
          setProfile(profileResult.data as Profile);
        }

        if (rolesResult.error) {
          logAuthError("Failed to fetch roles", {
            error: rolesResult.error.message,
          });
          return [];
        }

        const fetchedRoles =
          rolesResult.data?.map((r) => r.role as AppRole) || [];
        setRoles(fetchedRoles);

        if (fetchedRoles.length > 0) {
          logAuthRole({ role_detectado: fetchedRoles[0] });
        }

        return fetchedRoles;
      } catch (error: any) {
        clearTimeout(safetyTimeout);
        if (error.name === "AbortError") {
          console.error("[AUTH] fetchUserData TIMEOUT - request aborted");
          logAuthError("fetchUserData timeout", { userId });
        } else {
          console.error("[AUTH] fetchUserData CRITICAL ERROR:", error);
          logCriticalError("fetchUserData", error);
        }
        return [];
      }
    },
    [],
  );

  // ============================================
  // ROLE BOOTSTRAP (via Edge Function)
  // ============================================

  const bootstrapRoles = useCallback(async (sessionUser: User) => {
    try {
      const { data, error } = await supabase.functions.invoke("bootstrap-role", {
        body: { user_id: sessionUser.id, email: sessionUser.email },
      });

      if (error) {
        logAuthError("Role bootstrap failed", { error: error.message });
        logRoleBootstrap(sessionUser.id, null);
        return false;
      }

      if (data?.role_assigned) {
        logRoleBootstrap(sessionUser.id, data.role_assigned);
        logAuthRole({ role_detectado: data.role_assigned as AppRole });
        return true;
      }

      return false;
    } catch (error: any) {
      logCriticalError("bootstrapRoles", error);
      return false;
    }
  }, []);

  // ============================================
  // FULL USER LOAD (session -> profile -> roles)
  // ============================================

  const loadUserComplete = useCallback(
    async (sessionUser: User): Promise<AppRole[]> => {
      // Evita chamadas redundantes se já estiver carregando o mesmo usuário
      if (
        profileLoading &&
        userLoadInFlightUserIdRef.current === sessionUser.id
      )
        return roles;

      setProfileLoading(true);
      userLoadInFlightUserIdRef.current = sessionUser.id;

      try {
        // Passo 1: Busca inicial paralela (Perfil + Roles)
        let currentRoles = await fetchUserData(sessionUser.id);

        if (currentRoles.length === 0) {
          const bootstrapped = await bootstrapRoles(sessionUser);
          if (bootstrapped) {
            currentRoles = await fetchUserData(sessionUser.id);
          }

          if (currentRoles.length === 0) {
            const assigned = await ensureInitialRole(sessionUser);
            if (assigned) {
              currentRoles = await fetchUserData(sessionUser.id);
            }
          }

          if (currentRoles.length === 0) {
            for (let attempt = 0; attempt < 4 && currentRoles.length === 0; attempt++) {
              await new Promise((resolve) => setTimeout(resolve, 600));
              currentRoles = await fetchUserData(sessionUser.id);

              if (currentRoles.length === 0) {
                const retryBootstrap = await bootstrapRoles(sessionUser);
                if (retryBootstrap) {
                  currentRoles = await fetchUserData(sessionUser.id);
                }
              }
            }
          }
        }

        logAuthSuccess({ user_id: sessionUser.id, roles: currentRoles });
        return currentRoles;
      } catch (err) {
        console.error("[AUTH] loadUserComplete CRITICAL ERROR:", err);
        return [];
      } finally {
        setProfileLoading(false);
        userLoadInFlightUserIdRef.current = null;
      }
    },
    [fetchUserData, bootstrapRoles, ensureInitialRole, profileLoading, roles],
  );

  const runUserLoad = useCallback(
    async (sessionUser: User, force = false): Promise<AppRole[]> => {
      if (
        !force &&
        userLoadInFlightRef.current &&
        userLoadInFlightUserIdRef.current === sessionUser.id
      ) {
        return userLoadInFlightRef.current;
      }

      const runner = loadUserComplete(sessionUser)
        .catch((error) => {
          logCriticalError("runUserLoad", error);
          return [] as AppRole[];
        })
        .finally(() => {
          if (userLoadInFlightRef.current === runner) {
            userLoadInFlightRef.current = null;
            userLoadInFlightUserIdRef.current = null;
          }
        });

      userLoadInFlightRef.current = runner;
      userLoadInFlightUserIdRef.current = sessionUser.id;

      return runner;
    },
    [loadUserComplete],
  );

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
  // INITIALIZATION - runs ONCE
  // ============================================

  useEffect(() => {
    let isMounted = true;
    const startTime = Date.now();
    let currentUserId: string | null = null;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!isMounted) return;
      if (event === "INITIAL_SESSION") return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const incomingUserId = currentSession.user.id;
        const shouldReload =
          incomingUserId !== currentUserId || event === "SIGNED_IN";
        currentUserId = incomingUserId;

        // Critical: never await inside onAuthStateChange callback
        if (shouldReload) {
          queueMicrotask(() => {
            if (!isMounted) return;
            void runUserLoad(currentSession.user, true);
          });
        }
      } else if (event === "SIGNED_OUT" || !currentSession) {
        currentUserId = null;
        setProfile(null);
        setRoles([]);
        userLoadInFlightRef.current = null;
        userLoadInFlightUserIdRef.current = null;
      }
    });

    const initializeAuth = async () => {
      try {
        // getSession with implicit timeout managed by initializeAuth safety timer logic
        const {
          data: { session: existingSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          logAuthError("getSession failed", { error: error.message });
          console.error("[AUTH] getSession error:", error);
        }
        if (!isMounted) return;

        logAuthStart({ token_existe: !!existingSession?.access_token });

        setSession(existingSession);
        setUser(existingSession?.user ?? null);

        const validation = validateSession(existingSession);
        logAuthValidate({ token_valido: validation.isValid });

        if (existingSession?.user && validation.isValid) {
          currentUserId = existingSession.user.id;
          try {
            // This now has its own internal AbortController/Timeout
            await loadUserComplete(existingSession.user);
          } catch (userDataError) {
            console.error(
              "[AUTH] Failed to load user data during init:",
              userDataError,
            );
          }
        }
      } catch (error) {
        logCriticalError("initializeAuth", error);
      } finally {
        if (isMounted) {
          const duration = Date.now() - startTime;
          logLoadComplete({ duration_ms: duration, status: "liberado" });
          setLoading(false);
          setInitialLoadComplete(true);
          setAuthResolved(true);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runUserLoad]);

  // ============================================
  // AUTH METHODS
  // ============================================

  const signUp = async (
    email: string,
    password: string,
    metadata: SignUpMetadata,
  ) => {
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
            role: metadata.role,
          },
        },
      });

      if (error) {
        logAuthError("Signup failed", { error: error.message });
        return { error, needsConfirmation: false };
      }

      if (data.user) {
        rememberPendingRole(data.user.id, metadata.role);

        if (data.session && (metadata.cpf_cnpj || metadata.pix_key)) {
          await supabase
            .from("profiles")
            .update({ cpf_cnpj: metadata.cpf_cnpj, pix_key: metadata.pix_key })
            .eq("user_id", data.user.id);
        }

        // If auto-confirm is enabled (session returned immediately), assign role now
        if (data.session && SELF_ASSIGNABLE_ROLES.includes(metadata.role)) {
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: data.user.id,
              role: metadata.role,
            });
          if (!roleError) {
            setRoles([metadata.role]);
          }
        }
      }

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

  const sendPasswordResetEmail = async (email: string) => {
    try {
      // Use origin as redirectTo to ensure user returns to the app
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        logAuthError("Password reset failed", { error: error.message });
        return { error };
      }
      return { error: null };
    } catch (err) {
      logCriticalError("sendPasswordResetEmail", err);
      return { error: err as Error };
    }
  };

  const signInWithWhatsApp = async (whatsapp: string, password: string) => {
    try {
      const normalizedWhatsApp = whatsapp.replace(/\D/g, "");

      // Use SECURITY DEFINER function to bypass RLS on profiles
      const { data: emailFromNormalized } = await supabase.rpc(
        "get_email_by_whatsapp",
        { _whatsapp: normalizedWhatsApp },
      );

      let email = emailFromNormalized;

      // Try with formatted whatsapp if not found
      if (!email && whatsapp !== normalizedWhatsApp) {
        const { data: emailFromFormatted } = await supabase.rpc(
          "get_email_by_whatsapp",
          { _whatsapp: whatsapp },
        );
        email = emailFromFormatted;
      }

      if (!email) {
        const error = new Error(
          "WhatsApp não encontrado. Verifique o número ou crie uma conta.",
        );
        logAuthError("WhatsApp login - user not found", {
          whatsapp: normalizedWhatsApp,
        });
        return { error };
      }

      return signIn(email, password);
    } catch (err) {
      logCriticalError("signInWithWhatsApp", err);
      return { error: err as Error };
    }
  };

  const signInWithMagicLink = async (email: string, returnPath?: string) => {
    try {
      // Use current path so magic link returns to the correct login page
      const path = returnPath || window.location.pathname;
      const redirectUrl = `${window.location.origin}${path}`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectUrl },
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
      const loginPath = getLoginForRoute(currentPath);
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
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
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
      }}
    >
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

export {
  getDashboardForRole,
  getLoginForRoute,
  getLoginForRole as getLoginPathForRole,
} from "@/lib/route-config";
