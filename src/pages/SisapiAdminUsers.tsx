import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Shield, User, Settings, UserPlus, Loader2, Edit2, ShieldCheck, ShieldAlert, Trash2, Save, X, KeyRound, LayoutGrid, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepartmentManagement } from "@/components/sisapi/DepartmentManagement";
import { SectorManagement } from "@/components/sisapi/SectorManagement";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { SisapiPageHeader } from "@/components/sisapi/SisapiPageHeader";

import { Navigate, useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Badge } from "@/components/ui/badge";

export default function SisapiAdminUsers() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isModulesDialogOpen, setIsModulesDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [editingModules, setEditingModules] = useState<string[]>([]);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({ userId: "", password: "" });
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  const [editingName, setEditingName] = useState("");
  
  useEffect(() => {
    console.log("SisapiAdminUsers mounted");
    return () => console.log("SisapiAdminUsers unmounted");
  }, []);

  
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

  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  const moduleLabels: Record<string, string> = {
    sisapi: "SISAPI - Gestão Documental",
    surgeries: "Gestão de Cirurgias",
    hr: "Recursos Humanos",
    iose: "Lista Iose",
    exams: "Resultados de Exames"
  };

  const { data: currentUserProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["current-profile", user?.id],
    queryFn: async () => {
      if (user?.email === "admin@gmail.com") {
        return { is_admin: true };
      }
      const { data, error } = await supabase.from("sisapi_profiles").select("is_admin").eq("id", user?.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: profiles, isLoading: loadingProfiles, error: fetchError } = useQuery({
    queryKey: ["sisapi-admin-users-list"],
    queryFn: async () => {
      console.log("Iniciando busca de perfis...");
      const { data: profilesData, error: profilesError } = await supabase
        .from("sisapi_profiles")
        .select("*")
        .order("status", { ascending: false })
        .order("full_name", { ascending: true });
        
      if (profilesError) {
        console.error("Erro ao buscar perfis:", profilesError);
        throw profilesError;
      }

      console.log("Perfis retornados pelo banco:", profilesData?.length);

      // Se o email não estiver no perfil, tentamos via RPC
      const profilesWithEmails = await Promise.all((profilesData || []).map(async (profile) => {
        if (profile.email) return profile;

        try {
          const { data: userData } = await supabase.rpc('get_user_email' as any, { user_uuid: profile.id });
          return { ...profile, email: userData || (profile.id === user?.id ? user.email : "Email não recuperado") };
        } catch (err) {
          return { ...profile, email: profile.id === user?.id ? user.email : "Email não recuperado" };
        }
      }));

      return profilesWithEmails;
    },
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Notificar erro se houver
  useEffect(() => {
    if (fetchError) {
      toast.error("Erro ao carregar lista de usuários. Verifique sua conexão ou permissões.");
    }
  }, [fetchError]);


  const { data: roles } = useQuery({
    queryKey: ["sisapi-roles-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sisapi_roles").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });
  
  const { data: departments } = useQuery({
    queryKey: ["sisapi-departments-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sisapi_departments").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: sectors } = useQuery({
    queryKey: ["sisapi-sectors-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sisapi_sectors").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      console.log("Iniciando criação de usuário:", userData.email);
      const { data, error } = await supabase.functions.invoke("create-sisapi-user", {
        body: userData,
      });
      if (error) {
        console.error("Erro na Edge Function:", error);
        throw error;
      }
      if (data?.error) {
        console.error("Erro retornado pela função:", data.error);
        throw new Error(data.error);
      }
      return data;
    },
    onSuccess: (data) => {
      console.log("Usuário criado com sucesso:", data);
      toast.success("Usuário criado e ativado com sucesso!");
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
      // Delay pequeno para garantir que o banco processou a transação antes do refetch
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["sisapi-admin-users-list"] });
      }, 500);
    },
    onError: (error: any) => {
      toast.error("Erro ao criar usuário: " + error.message);
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      console.log(`Atualizando usuário ${userId}:`, updates);
      const { data, error } = await supabase.from("sisapi_profiles").update(updates).eq("id", userId).select();
      if (error) {
        console.error("Erro na atualização:", error);
        throw error;
      }
      console.log("Resposta da atualização:", data);
      return data;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["sisapi-admin-users-list"] });
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar: " + (error.message || "Erro desconhecido"));
    }
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      console.log(`Solicitando exclusão completa do usuário: ${profileId}`);
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { userId: profileId },
      });
      
      if (error) {
        console.error("Erro ao chamar delete-user:", error);
        throw error;
      }
      
      if (data?.error) {
        console.error("Erro retornado pela função delete-user:", data.error);
        throw new Error(data.error);
      }
      
      return data;
    },
    onSuccess: () => {
      toast.success("Usuário excluído permanentemente do banco de dados");
      queryClient.invalidateQueries({ queryKey: ["sisapi-admin-users-list"] });
    },
    onError: (error: any) => {
      console.error("Erro na mutação de exclusão:", error);
      toast.error("Erro ao remover usuário: " + error.message);
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      console.log(`Resetando senha para usuário ${userId}`);
      // Usamos uma Edge Function para resetar a senha via Admin Auth
      const { data, error } = await supabase.functions.invoke("reset-user-password", {
        body: { userId, password },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso! O usuário deverá alterá-la no próximo acesso.");
      setIsResetPasswordOpen(false);
      setResetPasswordData({ userId: "", password: "" });
      queryClient.invalidateQueries({ queryKey: ["sisapi-admin-users-list"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao redefinir senha: " + error.message);
    }
  });

  const { data: settings } = useQuery({

    queryKey: ["sisapi-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("sisapi_settings").select("*").limit(1).maybeSingle();
      return data;
    }
  });

  const handleUpdateModules = async () => {
    if (!selectedProfile) return;
    updateProfileMutation.mutate({
      userId: selectedProfile.id,
      updates: { allowed_modules: editingModules }
    });
    setIsModulesDialogOpen(false);
  };

  const isSpecialAdmin = user?.email === "admin@gmail.com" || currentUserProfile?.is_admin;

  if (loadingProfile && user?.email !== "admin@gmail.com") {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
        <p className="text-slate-500 animate-pulse">Verificando credenciais de acesso...</p>
      </div>
    );
  }
  
  // LOGS PARA DEBUG NO CONSOLE DO NAVEGADOR
  console.log("Debug Acesso:", { 
    userEmail: user?.email, 
    isAdmin: currentUserProfile?.is_admin,
    isSpecialAdmin,
    loadingProfile
  });

  if (!isSpecialAdmin && !loadingProfile && user?.email) {
    console.warn("Acesso negado: Redirecionando usuário não-admin", { 
      email: user.email, 
      isSpecial: isSpecialAdmin, 
      profile: currentUserProfile 
    });
    return <Navigate to="/modules" replace />;
  }






  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <SisapiPageHeader title="Gestão de Usuários" description="Controle de acessos, permissões e aprovação de novos colaboradores.">
        <div className="flex gap-3">

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg">
              <UserPlus className="w-5 h-5 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={(e) => { e.preventDefault(); createUserMutation.mutate(newUser); }}>
              <DialogHeader>
                <DialogTitle className="text-2xl">Cadastrar Novo Usuário</DialogTitle>
                <DialogDescription>Crie uma nova conta que será ativada imediatamente.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" value={newUser.full_name} onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} placeholder="Ex: João Silva" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} placeholder="usuario@gmail.com" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pass">Senha Temporária</Label>
                  <Input id="pass" type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} placeholder="Mínimo 6 caracteres" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-dept">Departamento</Label>
                    <Select value={newUser.department_id} onValueChange={(val) => setNewUser({...newUser, department_id: val, sector_id: ""})}>
                      <SelectTrigger id="new-dept">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-sector">Setor</Label>
                    <Select 
                      value={newUser.sector_id} 
                      onValueChange={(val) => setNewUser({...newUser, sector_id: val})}
                      disabled={!newUser.department_id}
                    >
                      <SelectTrigger id="new-sector">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors?.filter(s => s.department_id === newUser.department_id).map((sector) => (
                          <SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-role">Cargo</Label>
                  <Select value={newUser.role_id} onValueChange={(val) => setNewUser({...newUser, role_id: val})}>
                    <SelectTrigger id="new-role">
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles?.map((role) => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <Checkbox 
                    id="is_admin_new" 
                    checked={newUser.is_admin}
                    onCheckedChange={(checked) => setNewUser({...newUser, is_admin: !!checked})}
                  />
                  <Label htmlFor="is_admin_new" className="font-semibold cursor-pointer">Definir como Administrador (Acesso total)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createUserMutation.isPending} className="min-w-[120px]">
                  {createUserMutation.isPending ? <Loader2 className="animate-spin" /> : "Criar Usuário"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </SisapiPageHeader>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-slate-100 p-1 mb-6">
          <TabsTrigger value="users" className="px-8">Usuários Cadastrados</TabsTrigger>
          <TabsTrigger value="departments">Departamentos</TabsTrigger>
          <TabsTrigger value="sectors">Setores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[300px]">Nome do Usuário</TableHead>
                  <TableHead>Departamento / Setor</TableHead>
                  <TableHead>Cargo/Função</TableHead>
                  <TableHead>Status / Acesso</TableHead>
                  <TableHead>Módulos Ativos</TableHead>
                  <TableHead className="text-right">Gerenciar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingProfiles ? (
                  <TableRow><TableCell colSpan={5} className="h-40 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : profiles?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-40 text-center text-muted-foreground">Nenhum usuário encontrado.</TableCell></TableRow>
                ) : (
                  profiles?.map((profile) => (
                    <TableRow key={profile.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            {editingProfileId === profile.id ? (
                              <div className="flex items-center gap-2">
                                <Input 
                                  value={editingName} 
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="h-8 py-1 text-sm"
                                  autoFocus
                                />
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-green-600"
                                  onClick={() => {
                                    updateProfileMutation.mutate({ 
                                      userId: profile.id, 
                                      updates: { full_name: editingName } 
                                    });
                                    setEditingProfileId(null);
                                  }}
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-slate-400"
                                  onClick={() => setEditingProfileId(null)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 group">
                                <span className="text-slate-900 font-medium truncate">{profile.full_name}</span>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    setEditingProfileId(profile.id);
                                    setEditingName(profile.full_name || "");
                                  }}
                                >
                                  <Edit2 className="w-3 h-3 text-slate-400" />
                                </Button>
                              </div>
                            )}
                            <span className="text-xs text-slate-500 font-normal truncate">{profile.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Select 
                            value={profile.department_id || "none"} 
                            onValueChange={(val) => updateProfileMutation.mutate({ 
                              userId: profile.id, 
                              updates: { department_id: val === "none" ? null : val, sector_id: null } 
                            })}
                          >
                            <SelectTrigger className="w-full h-8 bg-slate-50/50 border-slate-200 text-xs">
                              <SelectValue placeholder="Depto" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhum Depto</SelectItem>
                              {departments?.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select 
                            value={profile.sector_id || "none"} 
                            onValueChange={(val) => updateProfileMutation.mutate({ 
                              userId: profile.id, 
                              updates: { sector_id: val === "none" ? null : val } 
                            })}
                            disabled={!profile.department_id}
                          >
                            <SelectTrigger className="w-full h-8 bg-slate-50/50 border-slate-200 text-xs">
                              <SelectValue placeholder="Setor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhum Setor</SelectItem>
                              {sectors?.filter(s => s.department_id === profile.department_id).map((sector) => (
                                <SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={profile.role_id || "none"} 
                          onValueChange={(val) => updateProfileMutation.mutate({ 
                            userId: profile.id, 
                            updates: { role_id: val === "none" ? null : val } 
                          })}
                        >
                          <SelectTrigger className="w-full bg-slate-50/50 border-slate-200 text-sm">
                            <SelectValue placeholder="Cargo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum Cargo</SelectItem>
                            {roles?.map((role) => (
                              <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {profile.is_admin ? (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 gap-1 px-3 py-1">
                              <ShieldCheck className="w-3 h-3" /> Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-600 px-3 py-1">Colaborador</Badge>
                          )}
                          <Badge className={`${profile.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-200'} hover:bg-opacity-100 px-3 py-1 capitalize`}>
                            {profile.status === 'active' ? 'Ativo' : 'Pendente'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {profile.allowed_modules?.length > 0 ? (
                            profile.allowed_modules.map((mod: string) => (
                              <Badge key={mod} variant="secondary" className="text-[10px] h-5 bg-slate-100 text-slate-600 border-none font-medium">
                                {mod.toUpperCase()}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">Nenhum</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5"
                            title="Gerenciar Módulos"
                            onClick={() => {
                              setSelectedProfile(profile);
                              setEditingModules(profile.allowed_modules || []);
                              setIsModulesDialogOpen(true);
                            }}
                          >
                            <LayoutGrid className="w-4 h-4" />
                          </Button>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5"
                            title="Redefinir Senha"
                            onClick={() => {
                              setResetPasswordData({ userId: profile.id, password: "" });
                              setIsResetPasswordOpen(true);
                            }}
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                title="Excluir Usuário"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Usuário permanentemente?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O usuário <strong>{profile.full_name}</strong> será removido do sistema e perderá todos os acessos imediatamente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteProfileMutation.mutate(profile.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {deleteProfileMutation.isPending ? <Loader2 className="animate-spin" /> : "Confirmar Exclusão"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="departments">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <DepartmentManagement />
          </div>
        </TabsContent>

        <TabsContent value="sectors">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <SectorManagement />
          </div>
        </TabsContent>
      </Tabs>

      {/* DIALOGS PARA MODULOS E SENHA */}
      <Dialog open={isModulesDialogOpen} onOpenChange={setIsModulesDialogOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-primary p-6 text-white">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Gerenciar Módulos
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80">
              Selecione quais áreas <strong>{selectedProfile?.full_name}</strong> pode acessar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-6 px-6">
            {Object.entries(moduleLabels).map(([id, label]) => (
              <div key={id} className="flex items-center space-x-3 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => {
                const newModules = editingModules.includes(id) 
                  ? editingModules.filter(m => m !== id)
                  : [...editingModules, id];
                setEditingModules(newModules);
              }}>
                <Checkbox 
                  id={`mod-${id}`} 
                  checked={editingModules.includes(id)}
                  className="data-[state=checked]:bg-primary"
                />
                <div className="flex-1">
                  <label htmlFor={`mod-${id}`} className="text-sm font-semibold text-slate-700 cursor-pointer group-hover:text-primary transition-colors">
                    {label}
                  </label>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="bg-slate-50 p-6 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setIsModulesDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateModules} disabled={updateProfileMutation.isPending} className="min-w-[150px] shadow-md">
              {updateProfileMutation.isPending ? <Loader2 className="animate-spin" /> : "Confirmar Acessos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={(e) => { e.preventDefault(); resetPasswordMutation.mutate(resetPasswordData); }}>
            <DialogHeader>
              <DialogTitle>Redefinir Senha Temporária</DialogTitle>
              <DialogDescription>
                Defina uma nova senha temporária. O usuário será obrigado a alterá-la no próximo login.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="reset-pass">Nova Senha Temporária</Label>
              <Input 
                id="reset-pass" 
                type="password" 
                value={resetPasswordData.password} 
                onChange={(e) => setResetPasswordData({...resetPasswordData, password: e.target.value})} 
                placeholder="Mínimo 6 caracteres" 
                required 
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsResetPasswordOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending ? <Loader2 className="animate-spin" /> : "Redefinir e Forçar Troca"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
