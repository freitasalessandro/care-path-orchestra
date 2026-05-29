import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DepartmentManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: departments, isLoading } = useQuery({
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
    setIsSubmitting(true);
    try {
      if (editingDept) {
        const { error } = await supabase
          .from("sisapi_departments")
          .update({ name })
          .eq("id", editingDept.id);
        if (error) throw error;
        toast.success("Departamento atualizado");
      } else {
        const { error } = await supabase
          .from("sisapi_departments")
          .insert([{ name }]);
        if (error) throw error;
        toast.success("Departamento criado");
      }
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["sisapi-departments-list"] });
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este departamento? Todos os setores vinculados serão excluídos.")) return;
    try {
      const { error } = await supabase.from("sisapi_departments").delete().eq("id", id);
      if (error) throw error;
      toast.success("Departamento excluído");
      queryClient.invalidateQueries({ queryKey: ["sisapi-departments-list"] });
      queryClient.invalidateQueries({ queryKey: ["sisapi-sectors-list"] });
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Departamentos</h2>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingDept(null);
            setName("");
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Novo Departamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingDept ? "Editar Departamento" : "Novo Departamento"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="dept-name">Nome do Departamento</Label>
                <Input id="dept-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Financeiro" required />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingDept ? "Salvar Alterações" : "Criar Departamento")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-xl overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={2} className="text-center py-8 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : departments?.length === 0 ? (
              <TableRow><TableCell colSpan={2} className="text-center py-8 text-slate-500">Nenhum departamento cadastrado.</TableCell></TableRow>
            ) : departments?.map((dept) => (
              <TableRow key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-medium text-slate-700">{dept.name}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => {
                    setEditingDept(dept);
                    setName(dept.name);
                    setIsOpen(true);
                  }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(dept.id)}>
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

