import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SisapiPageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function SisapiPageHeader({ title, description, children }: SisapiPageHeaderProps) {
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
      {children}
    </div>
  );
}
