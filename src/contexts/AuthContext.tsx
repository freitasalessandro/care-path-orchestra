import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  selectedModule: string | null;
  setSelectedModule: (module: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    // Check for dummy session
    const isDummy = localStorage.getItem("sb-dummy-session");
    if (isDummy) {
      setUser({ email: "admin@sistema.com", id: "admin-id" } as any);
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem("sb-dummy-session");
    await supabase.auth.signOut();
    setSelectedModule(null);
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
