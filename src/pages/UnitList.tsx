import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Building, Trash2, Pencil, Briefcase, Clock, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import { PrintSchedule } from "@/components/PrintSchedule";
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
  
  // Sector Management State (internal to the unit dialog)
  const [unitSectors, setUnitSectors] = useState<any[]>([]);
  const [newSector, setNewSector] = useState({ name: "", description: "", work_hours: "" });
  const [isAddingSector, setIsAddingSector] = useState(false);
  
  const [newUnit, setNewUnit] = useState({
    name: "",
    address: "",
    cnes: "",
    operating_hours: "",
    operating_days: "Segunda a Sexta",
  });

  const fetchUnits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("units")
      .select("*, departments(count)")
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

  const fetchUnitSectors = async (unitId: string) => {
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("unit_id", unitId)
      .order("name");
    
    if (error) {
      toast.error("Erro ao carregar setores da unidade");
    } else {
      setUnitSectors(data || []);
    }
  };

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
        setNewUnit({ name: "", address: "", cnes: "", operating_hours: "", operating_days: "Segunda a Sexta" });
        fetchUnits();
      }
    } else {
      const { data: createdUnit, error } = await supabase
        .from("units")
        .insert([newUnit])
        .select()
        .single();
      
      if (error) {
        toast.error(error.message || "Erro ao cadastrar unidade");
      } else {
        toast.success("Unidade cadastrada com sucesso! Agora você pode adicionar setores.");
        setNewUnit({ name: "", address: "", cnes: "", operating_hours: "", operating_days: "Segunda a Sexta" });
        setEditingUnit(createdUnit);
        setUnitSectors([]);
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
      operating_days: unit.operating_days || "Segunda a Sexta",
    });
    fetchUnitSectors(unit.id);
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

  const handleCreateSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;

    const payload = {
      name: newSector.name,
      description: newSector.description,
      work_hours: newSector.work_hours ? parseInt(newSector.work_hours) : null,
      unit_id: editingUnit.id
    };

    const { error } = await supabase.from("departments").insert([payload]);

    if (error) {
      toast.error(error.message || "Erro ao cadastrar setor");
    } else {
      toast.success("Setor cadastrado com sucesso!");
      setIsAddingSector(false);
      setNewSector({ name: "", description: "", work_hours: "" });
      fetchUnitSectors(editingUnit.id);
      fetchUnits(); 
    }
  };

  const handleDeleteSector = async (sectorId: string) => {
    const { error } = await supabase.from("departments").delete().eq("id", sectorId);
    if (error) {
      if (error.code === "23503") {
        toast.error("Não é possível excluir um setor que possui funcionários vinculados.");
      } else {
        toast.error("Erro ao excluir setor.");
      }
    } else {
      toast.success("Setor excluído com sucesso!");
      fetchUnitSectors(editingUnit.id);
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
          <p className="text-gray-600">Gestão de unidades de saúde e seus setores internos.</p>
        </div>

        <Button className="gap-2" onClick={() => {
          setEditingUnit(null);
          setNewUnit({ name: "", address: "", cnes: "", operating_hours: "", operating_days: "Segunda a Sexta" });
          setUnitSectors([]);
          setIsDialogOpen(true);
        }}>
          <Plus className="w-4 h-4" />
          Nova Unidade
        </Button>
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
              <TableHead>Setores</TableHead>
              <TableHead>Horário</TableHead>
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
                  <TableCell>
                    <PrintSchedule unitId={u.id} unitName={u.name} />
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col">
                      <span>{u.operating_days || "Segunda a Sexta"}</span>
                      <span className="text-[10px] text-muted-foreground">{u.operating_hours || "-"}</span>
                    </div>
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
                            Tem certeza que deseja excluir esta unidade? Esta ação não pode ser desfeita e removerá todos os setores vinculados.
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

      {/* Unit Form Dialog (includes Sector Management) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUnit ? `Editar Unidade: ${editingUnit.name}` : "Cadastrar Nova Unidade"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
            {/* Unit Info Section */}
            <div className="space-y-4 border-r pr-4">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground">Dados da Unidade</h3>
              <form onSubmit={handleCreateUnit} className="space-y-4">
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
                <div className="space-y-2">
                  <Label>Dias de Funcionamento</Label>
                  <ToggleGroup 
                    type="multiple" 
                    variant="outline" 
                    className="justify-start flex-wrap gap-2"
                    value={newUnit.operating_days ? newUnit.operating_days.split(", ") : []}
                    onValueChange={(values) => {
                      const daysOrder = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
                      const sortedValues = daysOrder.filter(d => values.includes(d));
                      setNewUnit({...newUnit, operating_days: sortedValues.join(", ")});
                    }}
                  >
                    <ToggleGroupItem value="Segunda" aria-label="Segunda" className="px-3">Seg</ToggleGroupItem>
                    <ToggleGroupItem value="Terça" aria-label="Terça" className="px-3">Ter</ToggleGroupItem>
                    <ToggleGroupItem value="Quarta" aria-label="Quarta" className="px-3">Qua</ToggleGroupItem>
                    <ToggleGroupItem value="Quinta" aria-label="Quinta" className="px-3">Qui</ToggleGroupItem>
                    <ToggleGroupItem value="Sexta" aria-label="Sexta" className="px-3">Sex</ToggleGroupItem>
                    <ToggleGroupItem value="Sábado" aria-label="Sábado" className="px-3">Sáb</ToggleGroupItem>
                    <ToggleGroupItem value="Domingo" aria-label="Domingo" className="px-3">Dom</ToggleGroupItem>
                  </ToggleGroup>
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
                <Button type="submit" className="w-full">
                  {editingUnit ? "Atualizar Unidade" : "Salvar Unidade"}
                </Button>
              </form>
            </div>

            {/* Sectors Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">Setores Internos</h3>
                {editingUnit && !isAddingSector && (
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setIsAddingSector(true)}>
                    <Plus className="w-3 h-3 mr-1" /> Adicionar Setor
                  </Button>
                )}
              </div>

              {!editingUnit ? (
                <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-gray-50 text-center p-4">
                  <Briefcase className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-xs text-muted-foreground">Salve a unidade primeiro para poder adicionar setores a ela.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {isAddingSector && (
                    <div className="p-3 border rounded-lg bg-primary/5 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="s-name" className="text-[11px]">Nome do Setor</Label>
                        <Input 
                          id="s-name" 
                          className="h-8 text-sm"
                          value={newSector.name}
                          onChange={e => setNewSector({...newSector, name: e.target.value})}
                          placeholder="Ex: Recepção, Farmácia..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="s-hours" className="text-[11px]">Carga Horária (horas)</Label>
                        <Input 
                          id="s-hours" 
                          type="number"
                          className="h-8 text-sm"
                          value={newSector.work_hours}
                          onChange={e => setNewSector({...newSector, work_hours: e.target.value})}
                          placeholder="Ex: 40"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 flex-1" onClick={handleCreateSector}>Salvar Setor</Button>
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => setIsAddingSector(false)}>Cancelar</Button>
                      </div>
                    </div>
                  )}

                  <div className="max-h-[350px] overflow-y-auto rounded-md border">
                    <Table>
                      <TableBody>
                        {unitSectors.length === 0 ? (
                          <TableRow>
                            <TableCell className="text-center py-6 text-[11px] text-muted-foreground">
                              Nenhum setor cadastrado.
                            </TableCell>
                          </TableRow>
                        ) : (
                          unitSectors.map((sector) => (
                            <TableRow key={sector.id}>
                              <TableCell className="py-2">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{sector.name}</span>
                                  {sector.work_hours && (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" /> {sector.work_hours}h
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-2 text-right space-x-1">
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-base">Excluir Setor</AlertDialogTitle>
                                      <AlertDialogDescription className="text-sm">
                                        Deseja excluir "{sector.name}"?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Não</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteSector(sector.id)} className="bg-red-600">Sim</AlertDialogAction>
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
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
