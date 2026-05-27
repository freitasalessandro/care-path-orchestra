import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Building } from "lucide-react";
import { toast } from "sonner";

export default function UnitList() {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newUnit, setNewUnit] = useState({
    name: "",
    address: "",
    phone: "",
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
    const { error } = await supabase.from("units").insert([newUnit]);
    
    if (error) {
      toast.error(error.message || "Erro ao cadastrar unidade");
    } else {
      toast.success("Unidade cadastrada com sucesso!");
      setIsDialogOpen(false);
      setNewUnit({ name: "", address: "", phone: "" });
      fetchUnits();
    }
  };

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">UBS / Unidades</h1>
          <p className="text-gray-600">Gestão de unidades de saúde e postos.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Unidade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Unidade</DialogTitle>
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
                <Label htmlFor="address">Endereço</Label>
                <Input 
                  id="address" 
                  value={newUnit.address} 
                  onChange={e => setNewUnit({...newUnit, address: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone de Contato</Label>
                <Input 
                  id="phone" 
                  value={newUnit.phone} 
                  onChange={e => setNewUnit({...newUnit, phone: e.target.value})} 
                />
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
          placeholder="Buscar unidade pelo nome..."
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
              <TableHead>Endereço</TableHead>
              <TableHead>Contato</TableHead>
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
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.address || "-"}</TableCell>
                  <TableCell className="text-sm">{u.phone || "-"}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                      Ativa
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Editar</Button>
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
