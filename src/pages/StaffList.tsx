import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, UserCircle, ExternalLink, Trash2, Pencil, FileText } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PrintTimesheet } from "@/components/PrintTimesheet";

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

export default function StaffList() {
  const { data: settings } = useQuery({
    queryKey: ["sisapi-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("sisapi_settings").select("*").limit(1).maybeSingle();
      return data;
    }
  });

  const [staff, setStaff] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [selectedStaffForPrint, setSelectedStaffForPrint] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const [newStaff, setNewStaff] = useState({
    registration_code: "",
    name: "",
    department_id: "",
    condition: "",
    phone: "",
    cpf: "",
    work_schedule: "",
  });

  const fetchData = async () => {
    setLoading(true);
    const [staffRes, deptRes] = await Promise.all([
      supabase.from("staff").select("*, departments(name)").order("name"),
      supabase.from("departments").select("*, units(name)").order("name"),
    ]);
    
    if (staffRes.error) {
      toast.error("Erro ao carregar funcionários");
    } else {
      setStaff(staffRes.data || []);
    }

    if (deptRes.error) {
      toast.error("Erro ao carregar setores");
    } else {
      setDepartments(deptRes.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const registration = newStaff.registration_code || null;
    
    const payload = {
      registration_code: registration,
      name: newStaff.name,
      department_id: newStaff.department_id || null,
      condition: newStaff.condition || null,
      phone: newStaff.phone,
      cpf: newStaff.cpf || null,
      work_schedule: newStaff.work_schedule || null,
    };

    if (editingStaff) {
      const { error } = await supabase
        .from("staff")
        .update(payload)
        .eq("id", editingStaff.id);

      if (error) {
        toast.error(error.message || "Erro ao atualizar funcionário");
      } else {
        toast.success("Funcionário atualizado com sucesso!");
        setIsDialogOpen(false);
        setEditingStaff(null);
        setNewStaff({ registration_code: "", name: "", department_id: "", condition: "", phone: "", cpf: "", work_schedule: "" });
        fetchData();
      }
    } else {
      const { error } = await supabase.from("staff").insert([payload]);
      
      if (error) {
        toast.error(error.message || "Erro ao cadastrar funcionário");
      } else {
        toast.success("Funcionário cadastrado com sucesso!");
        setIsDialogOpen(false);
        setNewStaff({ registration_code: "", name: "", department_id: "", condition: "", phone: "", cpf: "", work_schedule: "" });
        fetchData();
      }
    }
  };

  const handleEditClick = (s: any) => {
    setEditingStaff(s);
    setNewStaff({
      registration_code: s.registration_code || "",
      name: s.name || "",
      department_id: s.department_id || "",
      condition: s.condition || "",
      phone: s.phone || "",
      cpf: s.cpf || "",
      work_schedule: s.work_schedule || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteStaff = async (id: string) => {
    const { error } = await supabase.from("staff").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir funcionário.");
    } else {
      toast.success("Funcionário excluído com sucesso!");
      fetchData();
    }
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.registration_code && s.registration_code.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {settings?.institution_logo_url && (
            <img src={settings.institution_logo_url} alt="Logo" className="h-14 object-contain" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Funcionários</h1>
            <p className="text-gray-600">{settings?.institution_name || "Gestão de pessoal e cargos do sistema"}</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingStaff(null);
            setNewStaff({ registration_code: "", name: "", position_id: "", department_id: "", condition: "", phone: "", cpf: "", work_schedule: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStaff ? "Editar Funcionário" : "Cadastrar Funcionário"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateStaff} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  value={newStaff.name} 
                  onChange={e => setNewStaff({...newStaff, name: e.target.value})} 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF (Opcional)</Label>
                  <Input 
                    id="cpf" 
                    value={newStaff.cpf} 
                    onChange={e => setNewStaff({...newStaff, cpf: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    value={newStaff.phone} 
                    onChange={e => setNewStaff({...newStaff, phone: e.target.value})} 
                    required
                  />
                </div>
              </div>


              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dept">Setor</Label>
                </div>
                <Select 
                  value={newStaff.department_id} 
                  onValueChange={v => setNewStaff({...newStaff, department_id: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name} ({d.units?.name || "Sem unidade"})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cond">Condição (Opcional)</Label>
                  <Select 
                    value={newStaff.condition} 
                    onValueChange={v => setNewStaff({...newStaff, condition: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a condição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONTRATO">CONTRATO</SelectItem>
                      <SelectItem value="EFETIVO">EFETIVO</SelectItem>
                      <SelectItem value="COMISSIONADO">COMISSIONADO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg">Matrícula (Opcional)</Label>
                  <Input 
                    id="reg" 
                    value={newStaff.registration_code} 
                    onChange={e => setNewStaff({...newStaff, registration_code: e.target.value})} 
                    placeholder="Deixe vazio para preencher depois"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="work_schedule">Horário / Turno de Trabalho</Label>
                <Input 
                  id="work_schedule" 
                  value={newStaff.work_schedule} 
                  onChange={e => setNewStaff({...newStaff, work_schedule: e.target.value})} 
                  placeholder="Ex: 08:00 às 14:00 (Seg a Sex)"
                />
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
              <TableHead>Setor</TableHead>
              
              <TableHead>Condição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                      <div className="flex flex-col">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{s.registration_code}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{s.departments?.name || "-"}</TableCell>
                  <TableCell>
                    {s.condition ? (
                      <span className="text-xs font-semibold">{s.condition}</span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-[10px] bg-green-100 text-green-700">
                      {s.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedStaffForPrint(s);
                      setIsPrintDialogOpen(true);
                    }} title="Gerar Folha de Ponto">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(s)}>
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
                          <AlertDialogTitle>Excluir Funcionário</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteStaff(s.id)}
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
      
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gerar Folha de Ponto</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <Input value={selectedStaffForPrint?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="month-select">Selecione o Mês Inicial</Label>
              <Input 
                id="month-select"
                type="month" 
                value={format(selectedMonth, "yyyy-MM")}
                onChange={(e) => {
                  const [year, month] = e.target.value.split("-");
                  setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
                }}
              />
              <p className="text-[10px] text-muted-foreground">
                A folha será gerada do dia 10 de {format(selectedMonth, "MMMM", { locale: ptBR })} 
                até o dia 10 do mês seguinte.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrintDialogOpen(false)}>Cancelar</Button>
            {selectedStaffForPrint && (
              <PrintTimesheet staff={selectedStaffForPrint} month={selectedMonth} />
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
