import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, LayoutGrid } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface SisapiPageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function SisapiPageHeader({ title, description, children }: SisapiPageHeaderProps) {
  const { signOut, setSelectedModule } = useAuth();
  const navigate = useNavigate();
  
  const { data: settings } = useQuery({
    queryKey: ["sisapi-settings-header"],
    queryFn: async () => {
      const { data } = await supabase.from("sisapi_settings").select("*").limit(1).maybeSingle();
      return data;
    }
  });

  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-4">
        {settings?.institution_logo_url && (
          <img src={settings.institution_logo_url} alt="Logo" className="h-14 object-contain" />
        )}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          <p className="text-muted-foreground text-lg">
            {settings?.institution_name || "Sistema de Apoio à Gestão - SISAPI"}
            {description && <span className="block text-sm mt-1">{description}</span>}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {children}
      </div>

    </div>
  );
}
