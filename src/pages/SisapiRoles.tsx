import { RoleManagement } from "@/components/sisapi/RoleManagement";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { SisapiPageHeader } from "@/components/sisapi/SisapiPageHeader";

export default function SisapiRoles() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["sisapi-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("sisapi_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <div className="p-8">Verificando permissões...</div>;
  if (!profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <SisapiPageHeader 
        title="Funções e Permissões" 
        description="Defina cargos e gerencie o acesso de cada função às telas do sistema." 
      />
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <RoleManagement />
      </div>
    </div>
  );
}