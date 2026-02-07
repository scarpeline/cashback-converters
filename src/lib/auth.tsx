import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithWhatsApp: (whatsapp: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  getPrimaryRole: () => AppRole | null;
}

interface SignUpMetadata {
  name: string;
  whatsapp: string;
  role: AppRole;
  cpf_cnpj?: string;
  pix_key?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
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
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesData) {
        setRoles(rolesData.map(r => r.role as AppRole));
      }
    } catch (error) {
      console.error("[AUTH_ERROR] Failed to fetch user data:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer Supabase calls with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
        console.error("[AUTH_ERROR] Signup failed:", error.message);
        return { error };
      }

      // After successful signup, assign role via edge function or direct insert
      if (data.user) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: data.user.id,
            role: metadata.role
          });

        if (roleError) {
          console.error("[AUTH_ERROR] Role assignment failed:", roleError.message);
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

        console.log("[AUTH_OK]", data.user.id, metadata.role);
      }

      return { error: null };
    } catch (err) {
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
        console.error("[AUTH_ERROR] Login failed:", error.message);
        return { error };
      }

      console.log("[AUTH_OK] Login successful");
      return { error: null };
    } catch (err) {
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
        console.error("[AUTH_ERROR] Magic link failed:", error.message);
        return { error };
      }

      console.log("[AUTH_OK] Magic link sent");
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
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

// Route protection helper - Updated for new route structure
export function getRedirectPath(role: AppRole | null): string {
  switch (role) {
    case 'super_admin': return '/admin/dashboard';
    case 'contador': return '/contador2026/dashboard';
    case 'dono': return '/app/dashboard';
    case 'profissional': return '/app/profissional/dashboard';
    case 'afiliado_saas': return '/afiliado-saas/dashboard';
    case 'afiliado_barbearia': return '/app/dashboard';
    case 'cliente': return '/app/dashboard';
    default: return '/public/login';
  }
}

// Get login path for a specific role
export function getLoginPath(role: AppRole | null): string {
  switch (role) {
    case 'super_admin': return '/admin/login';
    case 'contador': return '/contador2026/login';
    case 'afiliado_saas': return '/afiliado-saas/login';
    default: return '/public/login';
  }
}
