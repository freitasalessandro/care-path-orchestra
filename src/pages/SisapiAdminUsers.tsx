import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Shield, User, Upload, Settings, UserCog, UserPlus, Loader2, Edit2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
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
  const [moduleLabels] = useState<Record<string, string>>({
    sisapi: "SISAPI - Gestão Documental",
    surgeries: "Gestão de Cirurgias",
    hr: "Recursos Humanos",
    iose: "Lista Iose",
    exams: "Resultados de Exames"
  });

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

  const { data: settings } = useQuery({
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

  const isSpecialAdmin = currentUserProfile?.is_admin || user?.email === "admin@sistema.com";

  if (loadingProfile && !isSpecialAdmin) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="ml-2">Verificando permissões...</span>
    </div>
  );
  
  if (!isSpecialAdmin && !loadingProfile) {
    console.log("Access denied. User email:", user?.email, "Is admin:", currentUserProfile?.is_admin);
    return <Navigate to="/modules" replace />;
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
                <DialogDescription>Ajuste parâmetros globais do SISAPI.</DialogDescription>
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
                    <label htmlFor="allowPublicRegistration" className="text-xs font-medium">Permitir cadastro público</label>
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
                    <label htmlFor="maintenanceMode" className="text-xs font-medium">Modo de manutenção</label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGeneralSettingsOpen(false)}>Cancelar</Button>
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
                  <DialogDescription>Adicione um novo colaborador ao SISAPI.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nome</Label>
                    <Input id="name" className="col-span-3" value={newUser.full_name} onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" type="email" className="col-span-3" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="pass" className="text-right">Senha</Label>
                    <Input id="pass" type="password" className="col-span-3" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Departamento</Label>
                    <div className="col-span-3">
                      <Select value={newUser.department_id} onValueChange={(val) => setNewUser({...newUser, department_id: val, sector_id: ""})}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{departments?.map((dept: any) => (<SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Setor</Label>
                    <div className="col-span-3">
                      <Select value={newUser.sector_id} onValueChange={(val) => setNewUser({...newUser, sector_id: val})} disabled={!newUser.department_id}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{sectors?.map((sector: any) => (<SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createUserMutation.isPending}>Criar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="departments">Departamentos</TabsTrigger>
          <TabsTrigger value="sectors">Setores</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <div className="bg-white rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Assinatura</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Carregando usuários...
                    </TableCell>
                  </TableRow>
                ) : profiles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  profiles?.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>{profile.full_name}</TableCell>
                      <TableCell>
                        <Select value={profile.role_id || "none"} onValueChange={(val) => updateRoleMutation.mutate({ userId: profile.id, roleId: val === "none" ? null : val })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem cargo</SelectItem>
                            {roles?.map((role) => (<SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" onClick={() => toggleAdmin(profile.id, profile.is_admin)}>
                          <Shield className={profile.is_admin ? "fill-slate-900" : ""} />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Input type="file" accept="image/png" onChange={(e) => handleSignatureUpload(profile.id, e)} className="hidden" id={`sig-${profile.id}`} />
                        <Label htmlFor={`sig-${profile.id}`} className="cursor-pointer text-blue-600 underline">Upload</Label>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" onClick={() => handleOpenModulesDialog(profile)}><Edit2 /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}

              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="departments"><DepartmentManagement /></TabsContent>
        <TabsContent value="sectors"><SectorManagement /></TabsContent>
      </Tabs>

      <Dialog open={isModulesDialogOpen} onOpenChange={setIsModulesDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Módulos</DialogTitle></DialogHeader>
          <div className="grid gap-2 py-4">
            {["sisapi", "surgeries", "hr", "iose", "exams"].map(mod => (
              <div key={mod} className="flex items-center space-x-3 p-2 rounded hover:bg-slate-50 transition-colors">
                <Checkbox 
                  id={`edit-mod-${mod}`} 
                  checked={editingModules.includes(mod)}
                  onCheckedChange={(checked) => checked ? setEditingModules([...editingModules, mod]) : setEditingModules(editingModules.filter(m => m !== mod))}
                />
                <label htmlFor={`edit-mod-${mod}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
                  {moduleLabels[mod] || mod}
                </label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModulesDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateModules} disabled={updateModulesMutation.isPending}>
              {updateModulesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>
    </div>
  );
}
