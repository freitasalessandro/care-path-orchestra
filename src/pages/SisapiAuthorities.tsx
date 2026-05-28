import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash, UserCheck, Shield, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSisapiAuthorities, SisapiAuthority } from "@/hooks/useSisapiAuthorities";

export default function SisapiAuthorities() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuth, setEditingAuth] = useState<SisapiAuthority | null>(null);
  
  // Form state
  const [tipo, setTipo] = useState("");
  const [autoridadeId, setAutoridadeId] = useState("");
  const [representanteId, setRepresentanteId] = useState("");
  const [ativo, setAtivo] = useState(true);

  const { authorities, isLoading, createAuthority, updateAuthority, deleteAuthority } = useSisapiAuthorities();

  const { data: users } = useQuery({
    queryKey: ["sisapi-active-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sisapi_profiles")
        .select("id, full_name")
        .eq("status", "active")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setTipo("");
    setAutoridadeId("");
    setRepresentanteId("");
    setAtivo(true);
    setEditingAuth(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (auth: SisapiAuthority) => {
    setEditingAuth(auth);
    setTipo(auth.tipo);
    setAutoridadeId(auth.autoridade_user_id);
    setRepresentanteId(auth.representante_user_id);
    setAtivo(auth.ativo);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!tipo || !autoridadeId || !representanteId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const data = {
      tipo,
      autoridade_user_id: autoridadeId,
      representante_user_id: representanteId,
      ativo,
    };

    try {
      if (editingAuth) {
        await updateAuthority.mutateAsync({ id: editingAuth.id, ...data });
      } else {
        await createAuthority.mutateAsync(data);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta autoridade?")) {
      await deleteAuthority.mutateAsync(id);
    }
  };

  const filteredAuthorities = authorities?.filter((auth) => {
    const term = search.toLowerCase();
    return (
      auth.autoridade?.full_name.toLowerCase().includes(term) ||
      auth.representante?.full_name.toLowerCase().includes(term) ||
      auth.tipo.toLowerCase().includes(term)
    );
  });

  const authorityTypes = [
    { value: "prefeito", label: "Prefeito(a)" },
    { value: "vice_prefeito", label: "Vice-Prefeito(a)" },
    { value: "secretario", label: "Secretário(a)" },
    { value: "presidente_camara", label: "Presidente da Câmara" },
    { value: "diretor", label: "Diretor(a)" },
    { value: "outro", label: "Outro" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Autoridades e Delegados</h1>
          <p className="text-muted-foreground">Configure representantes para assinar documentos em nome de autoridades.</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-slate-800 hover:bg-slate-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Autoridade
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou tipo..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Autoridade Titular</TableHead>
              <TableHead>Representante / Delegado</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Carregando autoridades...
                </TableCell>
              </TableRow>
            ) : filteredAuthorities?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma autoridade encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredAuthorities?.map((auth) => (
                <TableRow key={auth.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-500" />
                      {auth.autoridade?.full_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-500" />
                      {auth.representante?.full_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {authorityTypes.find(t => t.value === auth.tipo)?.label || auth.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {auth.ativo ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(auth)}>
                      <Pencil className="w-4 h-4 text-slate-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(auth.id)}>
                      <Trash className="w-4 h-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAuth ? "Editar Autoridade" : "Cadastrar Nova Autoridade"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo de Autoridade</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {authorityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="autoridade">Autoridade (Titular)</Label>
              <Select value={autoridadeId} onValueChange={setAutoridadeId}>
                <SelectTrigger id="autoridade">
                  <SelectValue placeholder="Selecione o usuário autoridade" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="representante">Representante (Delegado)</Label>
              <Select value={representanteId} onValueChange={setRepresentanteId}>
                <SelectTrigger id="representante">
                  <SelectValue placeholder="Selecione o representante" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label>Status:</Label>
              <Button
                type="button"
                variant={ativo ? "default" : "outline"}
                size="sm"
                onClick={() => setAtivo(true)}
                className={ativo ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              >
                <Check className="w-4 h-4 mr-1" /> Ativo
              </Button>
              <Button
                type="button"
                variant={!ativo ? "destructive" : "outline"}
                size="sm"
                onClick={() => setAtivo(false)}
              >
                <X className="w-4 h-4 mr-1" /> Inativo
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} className="bg-slate-800 hover:bg-slate-700">
              {editingAuth ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
