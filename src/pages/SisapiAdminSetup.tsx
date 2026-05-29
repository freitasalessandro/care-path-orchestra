import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase, ShieldCheck, Plus, Trash, Settings, Globe, Loader2, LayoutGrid, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { SisapiPageHeader } from "@/components/sisapi/SisapiPageHeader";
import { DepartmentManagement } from "@/components/sisapi/DepartmentManagement";
import { SectorManagement } from "@/components/sisapi/SectorManagement";
import { RoleManagement } from "@/components/sisapi/RoleManagement";

export default function SisapiAdminSetup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [generalSettings, setGeneralSettings] = useState({
    systemName: "SISAPI",
    maintenanceMode: false,
    allowPublicRegistration: false,
    contactEmail: ""
  });

  const { data: profile, isLoading: loadingProfile } = useQuery({
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

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["sisapi-general-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sisapi_settings")
        .select("general_settings, id")
        .maybeSingle();
      if (error) throw error;
      if (data?.general_settings) {
        setGeneralSettings(data.general_settings as any);
      }
      return data;
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const { data: current } = await supabase.from("sisapi_settings").select("id").maybeSingle();
      if (current) {
        const { error: updateError } = await supabase
          .from("sisapi_settings")
          .update({ general_settings: generalSettings })
          .eq("id", current.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("sisapi_settings").insert({ 
          general_settings: generalSettings,
          institution_name: generalSettings.systemName 
        });
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso");
      queryClient.invalidateQueries({ queryKey: ["sisapi-general-settings"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    }
  });

  if (loadingProfile) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="animate-spin w-8 h-8 text-primary" />
    </div>
  );

  if (!profile?.is_admin && user?.email !== "admin@gmail.com") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SisapiPageHeader 
        title="Configurações do Sistema" 
        description="Gerencie tabelas de apoio e parâmetros gerais do SISAPI." 
      />

      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="bg-slate-100 p-1 mb-6 flex flex-wrap h-auto border">
          <TabsTrigger value="departments" className="px-6 py-2 flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <LayoutGrid className="w-4 h-4" /> Departamentos
          </TabsTrigger>
          <TabsTrigger value="sectors" className="px-6 py-2 flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Settings className="w-4 h-4" /> Setores
          </TabsTrigger>
          <TabsTrigger value="roles" className="px-6 py-2 flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ShieldCheck className="w-4 h-4" /> Funções e Permissões
          </TabsTrigger>
          <TabsTrigger value="general" className="px-6 py-2 flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Globe className="w-4 h-4" /> Parâmetros Gerais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="mt-0">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <DepartmentManagement />
          </div>
        </TabsContent>

        <TabsContent value="sectors" className="mt-0">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <SectorManagement />
          </div>
        </TabsContent>

        <TabsContent value="roles" className="mt-0">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <RoleManagement />
          </div>
        </TabsContent>

        <TabsContent value="general" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros do Sistema</CardTitle>
              <CardDescription>Configure o comportamento global do SISAPI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 max-w-xl">
                <div className="space-y-2">
                  <Label>Nome do Sistema</Label>
                  <Input 
                    value={generalSettings.systemName}
                    onChange={(e) => setGeneralSettings({...generalSettings, systemName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email de Contato</Label>
                  <Input 
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) => setGeneralSettings({...generalSettings, contactEmail: e.target.value})}
                    placeholder="admin@exemplo.com"
                  />
                </div>
                <Button 
                  onClick={() => saveSettingsMutation.mutate()} 
                  disabled={saveSettingsMutation.isPending}
                  className="w-fit"
                >
                  {saveSettingsMutation.isPending && <Loader2 className="mr-2 animate-spin w-4 h-4" />}
                  Salvar Parâmetros
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}