import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  selectedModule: string | null;
  setSelectedModule: (module: string | null) => void;
  mustChangePassword: boolean;
  setMustChangePassword: (val: boolean) => void;
  profile: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [selectedModule, setSelectedModuleState] = useState<string | null>(
    localStorage.getItem("selectedModule")
  );

  const setSelectedModule = (module: string | null) => {
    setSelectedModuleState(module);
    if (module) {
      localStorage.setItem("selectedModule", module);
    } else {
      localStorage.removeItem("selectedModule");
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("sisapi_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
      if (data?.must_change_password) {
        setMustChangePassword(true);
      } else {
        setMustChangePassword(false);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    // Check for dummy session
    const isDummy = localStorage.getItem("sb-dummy-session");
    if (isDummy) {
      setUser({ email: "admin@gmail.com", id: "admin-id" } as any);
      setProfile({ is_admin: true, must_change_password: false });
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", event, session?.user?.id);
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setMustChangePassword(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      localStorage.removeItem("sb-dummy-session");
      localStorage.removeItem("selectedModule");
      setSelectedModuleState(null);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      // Force reload to ensure all states are cleared
      window.location.href = "/login";
    }
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut,
        selectedModule,
        setSelectedModule,
        mustChangePassword,
        setMustChangePassword,
        profile,
      }}
    >
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
