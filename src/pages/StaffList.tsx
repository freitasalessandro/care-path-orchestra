import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, UserCircle } from "lucide-react";
import { toast } from "sonner";

export default function StaffList() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newStaff, setNewStaff] = useState({
    registration_code: "",
    name: "",
    position: "",
    email: "",
    phone: "",
    cpf: "",
  });

  const fetchStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("name");
    
    if (error) {
      toast.error("Erro ao carregar funcionários");
    } else {
      setStaff(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("staff").insert([newStaff]);
    
    if (error) {
      toast.error(error.message || "Erro ao cadastrar funcionário");
    } else {
      toast.success("Funcionário cadastrado com sucesso!");
      setIsDialogOpen(false);
      setNewStaff({ registration_code: "", name: "", position: "", email: "", phone: "", cpf: "" });
      fetchStaff();
    }
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.registration_code.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funcionários</h1>
          <p className="text-gray-600">Gestão de pessoal e cargos.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Funcionário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateStaff} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reg">Matrícula / Código</Label>
                  <Input 
                    id="reg" 
                    value={newStaff.registration_code} 
                    onChange={e => setNewStaff({...newStaff, registration_code: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input 
                    id="cpf" 
                    value={newStaff.cpf} 
                    onChange={e => setNewStaff({...newStaff, cpf: e.target.value})} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  value={newStaff.name} 
                  onChange={e => setNewStaff({...newStaff, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pos">Cargo / Função</Label>
                <Input 
                  id="pos" 
                  value={newStaff.position} 
                  onChange={e => setNewStaff({...newStaff, position: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={newStaff.email} 
                    onChange={e => setNewStaff({...newStaff, email: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    value={newStaff.phone} 
                    onChange={e => setNewStaff({...newStaff, phone: e.target.value})} 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar Funcionário</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-border shadow-sm">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <Input
          placeholder="Buscar por nome ou matrícula..."
          className="border-none shadow-none focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funcionário</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Cargo</TableHead>
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
            ) : filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum funcionário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCircle className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium">{s.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.registration_code}</TableCell>
                  <TableCell>{s.position || "-"}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                      {s.status}
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
