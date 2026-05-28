import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, ShieldCheck, Plus, Trash, Settings, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";


export default function SisapiAdminSetup() {
  const [roleName, setRoleName] = useState("");
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

  const { data: roles, refetch: refetchRoles } = useQuery({
    queryKey: ["sisapi-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sisapi_roles").select("*").order("name");
      if (error) throw error;
      return data;
    },
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
        const { error: insertError } = await supabase.from("sisapi_settings").insert({ general_settings: generalSettings });
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

  const handleAddRole = async () => {
    if (!roleName) return;
    const { error } = await supabase.from("sisapi_roles").insert([{ name: roleName }]);
    if (error) toast.error("Erro ao adicionar função");
    else {
      toast.success("Função adicionada");
      setRoleName("");
      refetchRoles();
    }
  };


  if (loadingProfile) return <div className="p-8">Verificando permissões...</div>;
  if (!profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configurações SISAPI</h1>
        <p className="text-muted-foreground">Tabelas de apoio para o sistema documental.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Funções / Cargos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome da Função"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
              <Button onClick={handleAddRole}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles?.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>{role.name}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-red-600">
                          <Trash className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
