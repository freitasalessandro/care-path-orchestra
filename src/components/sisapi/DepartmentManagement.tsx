import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

export function DepartmentManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [name, setName] = useState("");

  const { data: departments, isLoading, refetch } = useQuery({
    queryKey: ["sisapi-departments"],
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
    if (editingDept) {
      const { error } = await supabase
        .from("sisapi_departments")
        .update({ name })
        .eq("id", editingDept.id);
      if (error) toast.error("Erro ao atualizar departamento");
      else {
        toast.success("Departamento atualizado");
        setIsOpen(false);
        refetch();
      }
    } else {
      const { error } = await supabase
        .from("sisapi_departments")
        .insert([{ name }]);
      if (error) toast.error("Erro ao criar departamento");
      else {
        toast.success("Departamento criado");
        setIsOpen(false);
        refetch();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este departamento? Todos os setores vinculados serão excluídos.")) return;
    const { error } = await supabase.from("sisapi_departments").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir departamento.");
    else {
      toast.success("Departamento excluído");
      refetch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Departamentos</h2>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingDept(null);
            setName("");
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" /> Novo Departamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDept ? "Editar Departamento" : "Novo Departamento"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="dept-name">Nome do Departamento</Label>
                <Input id="dept-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full">
                {editingDept ? "Salvar Alterações" : "Criar Departamento"}
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
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={2} className="text-center py-4">Carregando...</TableCell></TableRow>
            ) : departments?.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell className="font-medium">{dept.name}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingDept(dept);
                    setName(dept.name);
                    setIsOpen(true);
                  }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(dept.id)} className="text-red-600 hover:text-red-700">
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
