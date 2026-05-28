import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Shield, User, Settings, UserPlus, Loader2, Edit2, ShieldCheck, ShieldAlert } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

export default function SisapiAdminUsers() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isModulesDialogOpen, setIsModulesDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [editingModules, setEditingModules] = useState<string[]>([]);
  
  useEffect(() => {
    console.log("SisapiAdminUsers mounted");
    return () => console.log("SisapiAdminUsers unmounted");
  }, []);

  
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    role_id: "",
    is_admin: false,
    allowed_modules: ["sisapi"] as string[]
  });

  const { user } = useAuth();
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

  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ["sisapi-admin-users-list"],
    queryFn: async () => {
      // Obter perfis da tabela sisapi_profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("sisapi_profiles")
        .select(`*, role:role_id(id, name)`)
        .order("full_name", { ascending: true });
        
      if (profilesError) throw profilesError;

      return profilesData || [];
    },
  });


  const { data: roles } = useQuery({
    queryKey: ["sisapi-roles-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sisapi_roles").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
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
        is_admin: false,
        allowed_modules: ["sisapi"]
      });
      queryClient.invalidateQueries({ queryKey: ["sisapi-admin-users-list"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao criar usuário: " + error.message);
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const { error } = await supabase.from("sisapi_profiles").update(updates).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["sisapi-admin-users-list"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar: " + error.message);
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
    console.warn("Acesso negado: Redirecionando usuário não-admin");
    return <Navigate to="/modules" replace />;
  }





  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Usuários</h1>
          <p className="text-muted-foreground text-lg">Gerencie quem pode acessar o sistema e quais módulos estão visíveis.</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg">
              <UserPlus className="w-5 h-5 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={(e) => { e.preventDefault(); createUserMutation.mutate(newUser); }}>
              <DialogHeader>
                <DialogTitle className="text-2xl">Cadastrar Novo Usuário</DialogTitle>
                <DialogDescription>Crie uma nova conta com acesso restrito ou administrativo.</DialogDescription>
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
                  <TableHead>Cargo/Função</TableHead>
                  <TableHead>Tipo de Acesso</TableHead>
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
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <User className="w-5 h-5" />
                          </div>
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-medium">{profile.full_name}</span>
                          <span className="text-xs text-slate-500">{profile.email || "Email não disponível"}</span>
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
                          <SelectTrigger className="w-[200px] bg-transparent border-slate-200">
                            <SelectValue placeholder="Sem cargo definido" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem cargo</SelectItem>
                            {roles?.map((role: any) => (<SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`cursor-pointer gap-1.5 py-1 px-3 ${profile.is_admin ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                          onClick={() => updateProfileMutation.mutate({ userId: profile.id, updates: { is_admin: !profile.is_admin } })}
                        >
                          {profile.is_admin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                          {profile.is_admin ? "Administrador" : "Colaborador"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {profile.is_admin ? (
                            <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600">Todos os Módulos</Badge>
                          ) : profile.allowed_modules?.length > 0 ? (
                            profile.allowed_modules.map((m: string) => (
                              <Badge key={m} variant="secondary" className="text-[10px] uppercase tracking-wider">{m}</Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Nenhum</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-primary hover:bg-primary/10"
                          onClick={() => {
                            setSelectedProfile(profile);
                            setEditingModules(profile.allowed_modules || []);
                            setIsModulesDialogOpen(true);
                          }}
                          disabled={profile.is_admin}
                          title={profile.is_admin ? "Admins possuem acesso total" : "Editar permissões"}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
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
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Permissões de Módulo</DialogTitle>
            <DialogDescription>
              Selecione quais áreas o usuário <strong>{selectedProfile?.full_name}</strong> poderá visualizar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-6">
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
          <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 mt-2 rounded-b-xl border-t border-slate-200">
            <Button variant="ghost" onClick={() => setIsModulesDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateModules} disabled={updateProfileMutation.isPending} className="min-w-[150px] shadow-md">
              {updateProfileMutation.isPending ? <Loader2 className="animate-spin" /> : "Confirmar Acessos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
