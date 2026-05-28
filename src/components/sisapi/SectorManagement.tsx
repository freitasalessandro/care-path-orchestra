import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

export function SectorManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<any>(null);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const { data: sectors, isLoading, refetch } = useQuery({
    queryKey: ["sisapi-sectors"],
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
    if (!departmentId) {
      toast.error("Selecione um departamento");
      return;
    }

    const sectorData = { name, department_id: departmentId };

    if (editingSector) {
      const { error } = await supabase
        .from("sisapi_sectors")
        .update(sectorData)
        .eq("id", editingSector.id);
      if (error) toast.error("Erro ao atualizar setor");
      else {
        toast.success("Setor atualizado");
        setIsOpen(false);
        refetch();
      }
    } else {
      const { error } = await supabase
        .from("sisapi_sectors")
        .insert([sectorData]);
      if (error) toast.error("Erro ao criar setor");
      else {
        toast.success("Setor criado");
        setIsOpen(false);
        refetch();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este setor?")) return;
    const { error } = await supabase.from("sisapi_sectors").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir setor.");
    else {
      toast.success("Setor excluído");
      refetch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Setores</h2>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingSector(null);
            setName("");
            setDepartmentId("");
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" /> Novo Setor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSector ? "Editar Setor" : "Novo Setor"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="sector-name">Nome do Setor</Label>
                <Input id="sector-name" value={name} onChange={(e) => setName(e.target.value)} required />
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
              <Button type="submit" className="w-full">
                {editingSector ? "Salvar Alterações" : "Criar Setor"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Setor</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-4">Carregando...</TableCell></TableRow>
            ) : sectors?.map((sector) => (
              <TableRow key={sector.id}>
                <TableCell className="font-medium">{sector.name}</TableCell>
                <TableCell>{sector.department?.name}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingSector(sector);
                    setName(sector.name);
                    setDepartmentId(sector.department_id);
                    setIsOpen(true);
                  }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(sector.id)} className="text-red-600 hover:text-red-700">
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
