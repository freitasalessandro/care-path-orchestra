import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Edit2, Shield } from "lucide-react";
import { toast } from "sonner";

const AVAILABLE_PERMISSIONS = [
  { id: "dashboard", label: "Dashboard", path: "/" },
  { id: "documents", label: "Documentos", path: "/documentos" },
  { id: "new_document", label: "Novo Documento", path: "/documentos/novo" },
  { id: "pending", label: "Meus Pendentes", path: "/pendentes" },
  { id: "archive", label: "Acervo Digital", path: "/acervo" },
  { id: "users", label: "Gestão de Usuários", path: "/usuarios" },
  { id: "roles", label: "Funções e Cargos", path: "/funcoes" },
  { id: "settings", label: "Configurações", path: "/configuracoes" },
];

export function RoleManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

  const { data: roles, isLoading, refetch } = useQuery({
    queryKey: ["sisapi-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sisapi_roles")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const roleData = { 
      name, 
      description,
      permissions: permissions
    };

    if (editingRole) {
      const { error } = await supabase
        .from("sisapi_roles")
        .update(roleData)
        .eq("id", editingRole.id);
      if (error) toast.error("Erro ao atualizar função");
      else {
        toast.success("Função atualizada");
        setIsOpen(false);
        refetch();
      }
    } else {
      const { error } = await supabase
        .from("sisapi_roles")
        .insert([roleData]);
      if (error) toast.error("Erro ao criar função");
      else {
        toast.success("Função criada");
        setIsOpen(false);
        refetch();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta função?")) return;
    const { error } = await supabase.from("sisapi_roles").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir função. Ela pode estar em uso.");
    else {
      toast.success("Função excluída");
      refetch();
    }
  };

  const togglePermission = (permId: string) => {
    setPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId) 
        : [...prev, permId]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Funções / Cargos</h2>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingRole(null);
            setName("");
            setDescription("");
            setPermissions([]);
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" /> Nova Função
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingRole ? "Editar Função" : "Nova Função"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Nome da Função</Label>
                <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-desc">Descrição</Label>
                <Input id="role-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              
              <div className="space-y-3">
                <Label className="text-base font-semibold">Permissões de Acesso</Label>
                <div className="grid grid-cols-2 gap-3 border rounded-lg p-4 bg-slate-50">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <div key={perm.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`perm-${perm.id}`} 
                        checked={permissions.includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <label 
                        htmlFor={`perm-${perm.id}`} 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {perm.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingRole ? "Salvar Alterações" : "Criar Função"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Permissões</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-4">Carregando...</TableCell></TableRow>
            ) : roles?.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(role.permissions) && role.permissions.length > 0 ? (
                      role.permissions.map((p: string) => {
                        const permLabel = AVAILABLE_PERMISSIONS.find(ap => ap.id === p)?.label;
                        return permLabel ? (
                          <span key={p} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            {permLabel}
                          </span>
                        ) : null;
                      })
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Nenhuma permissão</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingRole(role);
                    setName(role.name);
                    setDescription(role.description || "");
                    setPermissions(Array.isArray(role.permissions) ? (role.permissions as string[]) : []);
                    setIsOpen(true);
                  }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(role.id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
