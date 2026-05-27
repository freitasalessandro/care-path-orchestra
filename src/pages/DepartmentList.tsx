import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Briefcase, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

import { PrintSchedule } from "@/components/PrintSchedule";

export default function DepartmentList() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
    unit_id: "",
  });

  const fetchData = async () => {
    setLoading(true);
    const [deptRes, unitRes] = await Promise.all([
      supabase.from("departments").select("*, units(name)").order("name"),
      supabase.from("units").select("*").order("name"),
    ]);
    
    if (deptRes.error) {
      toast.error("Erro ao carregar setores");
    } else {
      setDepartments(deptRes.data || []);
    }

    if (unitRes.error) {
      toast.error("Erro ao carregar unidades");
    } else {
      setUnits(unitRes.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("departments").insert([newDepartment]);
    
    if (error) {
      toast.error(error.message || "Erro ao cadastrar setor");
    } else {
      toast.success("Setor cadastrado com sucesso!");
      setIsDialogOpen(false);
      setNewDepartment({ name: "", description: "", unit_id: "" });
      fetchData();
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") {
        toast.error("Não é possível excluir um setor que possui funcionários vinculados.");
      } else {
        toast.error("Erro ao excluir setor.");
      }
    } else {
      toast.success("Setor excluído com sucesso!");
      fetchData();
    }
  };

  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Setores</h1>
          <p className="text-gray-600">Gestão de departamentos e setores organizacionais.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Setor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Setor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateDepartment} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Setor</Label>
                <Input 
                  id="name" 
                  value={newDepartment.name} 
                  onChange={e => setNewDepartment({...newDepartment, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade (UBS)</Label>
                <Select 
                  value={newDepartment.unit_id} 
                  onValueChange={v => setNewDepartment({...newDepartment, unit_id: v})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Descrição</Label>
                <Textarea 
                  id="desc" 
                  value={newDepartment.description} 
                  onChange={e => setNewDepartment({...newDepartment, description: e.target.value})} 
                  placeholder="Opcional..."
                />
              </div>
              <DialogFooter>
                <Button type="submit">Salvar Setor</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-border shadow-sm">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <Input
          placeholder="Buscar setor pelo nome..."
          className="border-none shadow-none focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Setor</TableHead>
              <TableHead>Unidade / UBS</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredDepartments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum setor encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredDepartments.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-medium">{d.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-gray-700">{d.units?.name || "Sem unidade"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.description || "-"}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                      Ativo
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <PrintSchedule departmentId={d.id} departmentName={d.name} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Setor</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este setor? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteDepartment(d.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>


                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
