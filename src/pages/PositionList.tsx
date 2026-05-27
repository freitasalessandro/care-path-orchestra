import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Scissors, Briefcase, Trash2 } from "lucide-react";
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


export default function PositionList() {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newPosition, setNewPosition] = useState({
    title: "",
    work_hours: 40,
  });

  const fetchPositions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .order("title");
    
    if (error) {
      toast.error("Erro ao carregar funções");
    } else {
      setPositions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleCreatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("positions").insert([newPosition]);
    
    if (error) {
      toast.error(error.message || "Erro ao cadastrar função");
    } else {
      toast.success("Função cadastrada com sucesso!");
      setIsDialogOpen(false);
      setNewPosition({ title: "", work_hours: 40 });
      fetchPositions();
    }
  };

  const filteredPositions = positions.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeletePosition = async (id: string) => {
    const { error } = await supabase.from("positions").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") {
        toast.error("Não é possível excluir uma função que possui funcionários vinculados.");
      } else {
        toast.error("Erro ao excluir função.");
      }
    } else {
      toast.success("Função excluída com sucesso!");
      fetchPositions();
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funções e Cargos</h1>
          <p className="text-gray-600">Gestão de funções e carga horária semanal.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Função
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Função</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePosition} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Função</Label>
                <Input 
                  id="title" 
                  value={newPosition.title} 
                  onChange={e => setNewPosition({...newPosition, title: e.target.value})} 
                  placeholder="Ex: Enfermeiro, Médico, etc"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Carga Horária Mensal (Horas)</Label>
                <Input 
                  id="hours" 
                  type="number"
                  value={newPosition.work_hours} 
                  onChange={e => setNewPosition({...newPosition, work_hours: parseInt(e.target.value) || 0})} 
                  required 
                />
              </div>

              <DialogFooter>
                <Button type="submit">Salvar Função</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-border shadow-sm">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <Input
          placeholder="Buscar função pelo título..."
          className="border-none shadow-none focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Carga Horária</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredPositions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Nenhuma função encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredPositions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium">{p.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>{p.work_hours}h / mês</TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2">
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Função</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir esta função? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePosition(p.id)}
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
