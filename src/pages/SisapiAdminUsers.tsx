import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Shield, User, Upload, Settings, UserCog, UserPlus, Loader2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DepartmentManagement } from "@/components/sisapi/DepartmentManagement";
import { SectorManagement } from "@/components/sisapi/SectorManagement";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export default function SisapiAdminUsers() {
  const [uploading, setUploading] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isModulesDialogOpen, setIsModulesDialogOpen] = useState(false);
  const [isGeneralSettingsOpen, setIsGeneralSettingsOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [editingModules, setEditingModules] = useState<string[]>([]);
  const [generalSettings, setGeneralSettings] = useState({
    systemName: "SISAPI",
    maintenanceMode: false,
    allowPublicRegistration: false,
    contactEmail: ""
  });

  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    role_id: "",
    department_id: "",
    sector_id: "",
    is_admin: false,
    allowed_modules: ["sisapi"] as string[]
  });


  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: currentUserProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["current-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sisapi_profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ["sisapi-admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sisapi_profiles")
        .select(`
          *,
          role:role_id(id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["sisapi-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sisapi_roles").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["sisapi-departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sisapi_departments").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: sectors } = useQuery({
    queryKey: ["sisapi-sectors", newUser.department_id],
    queryFn: async () => {
      if (!newUser.department_id) return [];
      const { data, error } = await supabase
        .from("sisapi_sectors")
        .select("*")
        .eq("department_id", newUser.department_id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!newUser.department_id
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
      setIsGeneralSettingsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["sisapi-general-settings"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const { data, error } = await supabase.functions.invoke("create-sisapi-user", {
        body: userData,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      setIsCreateDialogOpen(false);
      setNewUser({
        email: "",
        password: "",
        full_name: "",
        role_id: "",
        department_id: "",
        sector_id: "",
        is_admin: false,
        allowed_modules: ["sisapi"]
      });

      refetch();
    },
    onError: (error: any) => {
      toast.error("Erro ao criar usuário: " + error.message);
    }
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string | null }) => {
      const { error } = await supabase
        .from("sisapi_profiles")
        .update({ role_id: roleId })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cargo atualizado com sucesso");
      refetch();
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar cargo: " + error.message);
    }
  });

  const updateModulesMutation = useMutation({
    mutationFn: async ({ userId, modules }: { userId: string; modules: string[] }) => {
      const { error } = await supabase
        .from("sisapi_profiles")
        .update({ allowed_modules: modules })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Módulos atualizados com sucesso");
      setIsModulesDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar módulos: " + error.message);
    }
  });

  const handleOpenModulesDialog = (profile: any) => {
    setSelectedProfile(profile);
    setEditingModules(profile.allowed_modules || ["sisapi"]);
    setIsModulesDialogOpen(true);
  };

  const handleUpdateModules = () => {
    if (selectedProfile) {
      updateModulesMutation.mutate({
        userId: selectedProfile.id,
        modules: editingModules
      });
    }
  };


  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("sisapi_profiles")
      .update({ status: "approved" })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao aprovar usuário");
    } else {
      toast.success("Usuário aprovado com sucesso");
      refetch();
    }
  };

  const toggleAdmin = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("sisapi_profiles")
      .update({ is_admin: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao alterar privilégios");
    } else {
      toast.success("Privilégios alterados com sucesso");
      refetch();
    }
  };

  const handleSignatureUpload = async (userId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    if (file.type !== "image/png") {
      toast.error("Por favor, envie uma imagem em formato PNG.");
      return;
    }

    setUploading(userId);
    try {
      const fileName = `signatures/${userId}-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('logos') 
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("sisapi_profiles")
        .update({ signature_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      toast.success("Assinatura atualizada com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error("Erro ao enviar assinatura: " + error.message);
    } finally {
      setUploading(null);
    }
  };

  if (loadingProfile) return <div className="p-8">Verificando permissões...</div>;
  if (!currentUserProfile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Usuários</h1>
          <p className="text-muted-foreground">Controle de acessos, cargos e assinaturas dos usuários do SISAPI.</p>
        </div>
        
        <div className="flex gap-2">











          <Dialog open={isGeneralSettingsOpen} onOpenChange={setIsGeneralSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Configurações Gerais
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Configurações Gerais do Sistema</DialogTitle>
                <DialogDescription>
                  Ajuste parâmetros globais do SISAPI.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="systemName" className="text-right text-xs">Nome do Sistema</Label>
                  <Input 
                    id="systemName" 
                    className="col-span-3" 
                    value={generalSettings.systemName}
                    onChange={(e) => setGeneralSettings({...generalSettings, systemName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contactEmail" className="text-right text-xs">E-mail de Contato</Label>
                  <Input 
                    id="contactEmail" 
                    className="col-span-3" 
                    value={generalSettings.contactEmail}
                    onChange={(e) => setGeneralSettings({...generalSettings, contactEmail: e.target.value})}
                    placeholder="suporte@sistema.com"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-xs">Público</Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox 
                      id="allowPublicRegistration" 
                      checked={generalSettings.allowPublicRegistration}
                      onCheckedChange={(checked) => setGeneralSettings({...generalSettings, allowPublicRegistration: !!checked})}
                    />
                    <label htmlFor="allowPublicRegistration" className="text-xs font-medium">
                      Permitir cadastro público na tela de login
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-xs">Manutenção</Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox 
                      id="maintenanceMode" 
                      checked={generalSettings.maintenanceMode}
                      onCheckedChange={(checked) => setGeneralSettings({...generalSettings, maintenanceMode: !!checked})}
                    />
                    <label htmlFor="maintenanceMode" className="text-xs font-medium">
                      Ativar modo de manutenção
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGeneralSettingsOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => saveSettingsMutation.mutate()} disabled={saveSettingsMutation.isPending}>
                  {saveSettingsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900">
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Adicione um novo colaborador ao sistema SISAPI.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Nome</Label>
                  <Input 
                    id="name" 
                    className="col-span-3" 
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    className="col-span-3" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="email@instituicao.gov.br"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pass" className="text-right">Senha</Label>
                  <Input 
                    id="pass" 
                    type="password"
                    className="col-span-3" 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Departamento</Label>
                  <div className="col-span-3">
                    <Select 
                      value={newUser.department_id} 
                      onValueChange={(val) => setNewUser({...newUser, department_id: val, sector_id: ""})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments?.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Setor</Label>
                  <div className="col-span-3">
                    <Select 
                      value={newUser.sector_id} 
                      onValueChange={(val) => setNewUser({...newUser, sector_id: val})}
                      disabled={!newUser.department_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={newUser.department_id ? "Selecione um setor" : "Selecione um departamento primeiro"} />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors?.map((sector: any) => (
                          <SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Cargo</Label>
                  <div className="col-span-3">
                    <Select 
                      value={newUser.role_id} 
                      onValueChange={(val) => setNewUser({...newUser, role_id: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles?.map((role) => (
                          <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Admin</Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox 
                      id="is_admin" 
                      checked={newUser.is_admin}
                      onCheckedChange={(checked) => setNewUser({...newUser, is_admin: !!checked})}
                    />
                    <label htmlFor="is_admin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Conceder acesso administrativo
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar Usuário
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="users" className="data-[state=active]:bg-slate-100">Usuários</TabsTrigger>
          <TabsTrigger value="departments" className="data-[state=active]:bg-slate-100">Departamentos</TabsTrigger>
          <TabsTrigger value="sectors" className="data-[state=active]:bg-slate-100">Setores</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Cargo / Função</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Assinatura (PNG)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
                  </TableRow>
                ) : profiles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">Nenhum usuário encontrado.</TableCell>
                  </TableRow>
                ) : (
                  profiles?.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="w-8 h-8 p-1.5 rounded-full bg-slate-100 text-slate-400" />
                          <div>
                            <div className="font-semibold">{profile.full_name || "Sem nome"}</div>
                            <div className="text-xs text-muted-foreground">{profile.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={profile.role_id || "none"} 
                          onValueChange={(val) => updateRoleMutation.mutate({ 
                            userId: profile.id, 
                            roleId: val === "none" ? null : val 
                          })}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sem cargo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem cargo</SelectItem>
                            {roles?.map((role) => (
                              <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={profile.is_admin ? "text-slate-900 font-bold" : "text-slate-400"}
                          onClick={() => toggleAdmin(profile.id, profile.is_admin)}
                        >
                          <Shield className={`w-4 h-4 mr-1 ${profile.is_admin ? "fill-slate-900" : ""}`} />
                          {profile.is_admin ? "Administrador" : "Comum"}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {profile.signature_url ? (
                            <div className="relative group">
                              <img src={profile.signature_url} alt="Assinatura" className="h-10 w-24 object-contain border rounded p-1 bg-slate-50" />
                              <Label htmlFor={`sig-${profile.id}`} className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center cursor-pointer rounded">
                                <Upload className="w-4 h-4 text-white" />
                              </Label>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`sig-${profile.id}`} className="flex items-center gap-1 text-xs text-blue-600 cursor-pointer hover:underline">
                                <Upload className="w-3 h-3" /> Anexar PNG
                              </Label>
                            </div>
                          )}
                          <input 
                            id={`sig-${profile.id}`} 
                            type="file" 
                            accept="image/png" 
                            className="hidden" 
                            onChange={(e) => handleSignatureUpload(profile.id, e)}
                            disabled={uploading === profile.id}
                          />
                          {uploading === profile.id && <span className="text-[10px] animate-pulse">Enviando...</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {(profile.status !== "approved" && profile.status !== "active") && (
                          <Button variant="outline" size="sm" onClick={() => handleApprove(profile.id)}>
                            <UserCheck className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Gerenciar Módulos"
                          onClick={() => handleOpenModulesDialog(profile)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Configurações Avançadas">
                          <UserCog className="w-4 h-4" />
                        </Button>

                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="bg-white p-6 rounded-lg border shadow-sm">
          <DepartmentManagement />
        </TabsContent>

        <TabsContent value="sectors" className="bg-white p-6 rounded-lg border shadow-sm">
          <SectorManagement />
        </TabsContent>
      </Tabs>

      <Dialog open={isModulesDialogOpen} onOpenChange={setIsModulesDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gerenciar Módulos</DialogTitle>
            <DialogDescription>
              Selecione quais módulos o usuário <strong>{selectedProfile?.full_name}</strong> pode acessar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {[
              { id: "sisapi", label: "Gestão Documental" },
              { id: "surgeries", label: "Cirurgias" },
              { id: "hr", label: "RH" },
              { id: "iose", label: "Iose" },
              { id: "exams", label: "Exames" }
            ].map((mod) => (
              <div key={mod.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <Checkbox 
                  id={`edit-mod-${mod.id}`}
                  checked={editingModules.includes(mod.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setEditingModules([...editingModules, mod.id]);
                    } else {
                      setEditingModules(editingModules.filter(m => m !== mod.id));
                    }
                  }}
                />
                <label htmlFor={`edit-mod-${mod.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
                  {mod.label}
                </label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModulesDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateModules} disabled={updateModulesMutation.isPending}>
              {updateModulesMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
