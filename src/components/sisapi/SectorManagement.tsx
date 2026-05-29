import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SectorManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<any>(null);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: sectors, isLoading } = useQuery({
    queryKey: ["sisapi-sectors-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sisapi_sectors")
        .select("*, department:department_id(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["sisapi-departments-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sisapi_departments")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId) {
      toast.error("Selecione um departamento");
      return;
    }

    setIsSubmitting(true);
    try {
      const sectorData = { name, department_id: departmentId };

      if (editingSector) {
        const { error } = await supabase
          .from("sisapi_sectors")
          .update(sectorData)
          .eq("id", editingSector.id);
        if (error) throw error;
        toast.success("Setor atualizado");
      } else {
        const { error } = await supabase
          .from("sisapi_sectors")
          .insert([sectorData]);
        if (error) throw error;
        toast.success("Setor criado");
      }
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["sisapi-sectors-list"] });
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este setor?")) return;
    try {
      const { error } = await supabase.from("sisapi_sectors").delete().eq("id", id);
      if (error) throw error;
      toast.success("Setor excluído");
      queryClient.invalidateQueries({ queryKey: ["sisapi-sectors-list"] });
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Setores</h2>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingSector(null);
            setName("");
            setDepartmentId("");
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Novo Setor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingSector ? "Editar Setor" : "Novo Setor"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="sector-name">Nome do Setor</Label>
                <Input id="sector-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Recepção" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-select">Departamento</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger id="dept-select">
                    <SelectValue placeholder="Selecione um departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingSector ? "Salvar Alterações" : "Criar Setor")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-xl overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Setor</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : sectors?.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-500">Nenhum setor cadastrado.</TableCell></TableRow>
            ) : sectors?.map((sector) => (
              <TableRow key={sector.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-medium text-slate-700">{sector.name}</TableCell>
                <TableCell className="text-slate-600">{sector.department?.name || "Sem depto"}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => {
                    setEditingSector(sector);
                    setName(sector.name);
                    setDepartmentId(sector.department_id);
                    setIsOpen(true);
                  }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(sector.id)}>
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

