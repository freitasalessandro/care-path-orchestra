import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Building, Trash2, Pencil } from "lucide-react";
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

export default function UnitList() {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  
  const [newUnit, setNewUnit] = useState({
    name: "",
    address: "",
    cnes: "",
    operating_hours: "",
  });

  const fetchUnits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("units")
      .select("*")
      .order("name");
    
    if (error) {
      toast.error("Erro ao carregar unidades");
    } else {
      setUnits(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUnit) {
      const { error } = await supabase
        .from("units")
        .update(newUnit)
        .eq("id", editingUnit.id);

      if (error) {
        toast.error(error.message || "Erro ao atualizar unidade");
      } else {
        toast.success("Unidade atualizada com sucesso!");
        setIsDialogOpen(false);
        setEditingUnit(null);
        setNewUnit({ name: "", address: "", cnes: "", operating_hours: "" });
        fetchUnits();
      }
    } else {
      const { error } = await supabase.from("units").insert([newUnit]);
      
      if (error) {
        toast.error(error.message || "Erro ao cadastrar unidade");
      } else {
        toast.success("Unidade cadastrada com sucesso!");
        setIsDialogOpen(false);
        setNewUnit({ name: "", address: "", cnes: "", operating_hours: "" });
        fetchUnits();
      }
    }
  };

  const handleEditClick = (unit: any) => {
    setEditingUnit(unit);
    setNewUnit({
      name: unit.name || "",
      address: unit.address || "",
      cnes: unit.cnes || "",
      operating_hours: unit.operating_hours || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteUnit = async (id: string) => {
    const { error } = await supabase.from("units").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir unidade.");
    } else {
      toast.success("Unidade excluída com sucesso!");
      fetchUnits();
    }
  };

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.cnes && u.cnes.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">UBS / Unidades</h1>
          <p className="text-gray-600">Gestão de unidades de saúde e postos.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingUnit(null);
            setNewUnit({ name: "", address: "", cnes: "", operating_hours: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Unidade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingUnit ? "Editar Unidade" : "Cadastrar Unidade"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUnit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Unidade (UBS)</Label>
                <Input 
                  id="name" 
                  value={newUnit.name} 
                  onChange={e => setNewUnit({...newUnit, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnes">CNES</Label>
                <Input 
                  id="cnes" 
                  value={newUnit.cnes} 
                  onChange={e => setNewUnit({...newUnit, cnes: e.target.value})} 
                  placeholder="Código CNES"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input 
                  id="address" 
                  value={newUnit.address} 
                  onChange={e => setNewUnit({...newUnit, address: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="open_time">Horário de Abertura</Label>
                  <Input 
                    id="open_time" 
                    type="time"
                    value={newUnit.operating_hours.includes(" às ") ? newUnit.operating_hours.split(" às ")[0] : ""} 
                    onChange={e => {
                      const parts = newUnit.operating_hours.split(" às ");
                      const close = parts.length > 1 ? parts[1] : "17:00";
                      setNewUnit({...newUnit, operating_hours: `${e.target.value} às ${close}`});
                    }} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="close_time">Horário de Fechamento</Label>
                  <Input 
                    id="close_time" 
                    type="time"
                    value={newUnit.operating_hours.includes(" às ") ? newUnit.operating_hours.split(" às ")[1] : ""} 
                    onChange={e => {
                      const parts = newUnit.operating_hours.split(" às ");
                      const open = parts.length > 0 ? parts[0] : "07:00";
                      setNewUnit({...newUnit, operating_hours: `${open} às ${e.target.value}`});
                    }} 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar Unidade</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-border shadow-sm">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <Input
          placeholder="Buscar unidade pelo nome ou CNES..."
          className="border-none shadow-none focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidade</TableHead>
              <TableHead>CNES</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredUnits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma unidade encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredUnits.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Building className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{u.name}</span>
                        <span className="text-[10px] text-muted-foreground">{u.address || "Sem endereço"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono">{u.cnes || "-"}</TableCell>
                  <TableCell className="text-sm">{u.operating_hours || "-"}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-[10px] bg-green-100 text-green-700">
                      Ativa
                    </span>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(u)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Unidade</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir esta unidade? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteUnit(u.id)}
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
