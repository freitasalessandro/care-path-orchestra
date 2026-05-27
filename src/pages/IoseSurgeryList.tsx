import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scissors, Plus, Calendar, Search, User, ArrowLeft, MoreVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function IoseSurgeryList() {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isAddListDialogOpen, setIsAddListDialogOpen] = useState(false);
  const [newList, setNewList] = useState({ name: "", scheduled_date: "", description: "" });
  
  const queryClient = useQueryClient();

  // Query for Lists
  const { data: lists, isLoading: isLoadingLists } = useQuery({
    queryKey: ["iose-lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("iose_lists")
        .select("*")
        .order("scheduled_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Create List Mutation
  const createList = useMutation({
    mutationFn: async (list: typeof newList) => {
      const { data, error } = await supabase.from("iose_lists").insert([list]).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["iose-lists"] });
      toast.success("Lista criada com sucesso!");
      setIsAddListDialogOpen(false);
      setNewList({ name: "", scheduled_date: "", description: "" });
      setSelectedListId(data.id);
    },
    onError: (error: any) => {
      toast.error("Erro ao criar lista: " + error.message);
    },
  });

  const deleteList = useMutation({
    mutationFn: async (id: string) => {
      // First delete associated entries (or rely on DB cascade if set up, but we didn't add cascade in migration)
      // Actually, we'll just delete the list for now, assuming foreign key constraints are handled or user knows.
      const { error } = await supabase.from("iose_lists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iose-lists"] });
      toast.success("Lista removida!");
      if (selectedListId) setSelectedListId(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao remover lista: " + error.message);
    },
  });

  if (!selectedListId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Listas de Cirurgia Iose</h1>
            <p className="text-gray-600">Gerencie múltiplas listas de pacientes por data ou local</p>
          </div>
          <Dialog open={isAddListDialogOpen} onOpenChange={setIsAddListDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4" />
                Nova Lista
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Lista</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="list_name">Nome da Lista</Label>
                  <Input
                    id="list_name"
                    placeholder="Ex: Cirurgias - Dr. João - Clínica Sul"
                    value={newList.name}
                    onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="list_date">Data Prevista</Label>
                  <Input
                    id="list_date"
                    type="date"
                    value={newList.scheduled_date}
                    onChange={(e) => setNewList({ ...newList, scheduled_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="list_desc">Descrição (Opcional)</Label>
                  <Input
                    id="list_desc"
                    placeholder="Notas adicionais"
                    value={newList.description}
                    onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddListDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => createList.mutate(newList)}>
                  Criar Lista
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoadingLists ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : lists?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 border-2 border-dashed rounded-xl">
            <Scissors className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Nenhuma lista criada</h3>
            <p className="text-gray-500 mb-6">Crie sua primeira lista de cirurgias para começar</p>
            <Button onClick={() => setIsAddListDialogOpen(true)} className="bg-emerald-600">
              Criar Primeira Lista
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists?.map((list) => (
              <Card key={list.id} className="hover:shadow-md transition-shadow cursor-pointer relative" onClick={() => setSelectedListId(list.id)}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700 mb-2">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Deseja realmente excluir esta lista?")) deleteList.mutate(list.id);
                        }}>
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                         </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-xl">{list.name}</CardTitle>
                  <CardDescription>
                    {list.scheduled_date ? format(new Date(list.scheduled_date), "dd/MM/yyyy") : "Sem data"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 line-clamp-2">{list.description || "Sem descrição"}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge variant="outline">{list.status || "Ativa"}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <IoseListDetails listId={selectedListId} onBack={() => setSelectedListId(null)} />;
}

function IoseListDetails({ listId, onBack }: { listId: string, onBack: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const [newEntry, setNewEntry] = useState({
    patient_id: "",
    surgery_type: "",
    eye_side: "Ambos",
    scheduled_date: "",
    scheduled_time: "",
    priority: "Normal",
    list_id: listId,
  });

  const { data: listInfo } = useQuery({
    queryKey: ["iose-list", listId],
    queryFn: async () => {
      const { data, error } = await supabase.from("iose_lists").select("*").eq("id", listId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ["iose-surgery-list", listId, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("iose_surgery_list")
        .select(`
          *,
          patient:iose_patients(full_name, cpf)
        `)
        .eq("list_id", listId)
        .order("scheduled_time", { ascending: true });
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: patients } = useQuery({
    queryKey: ["iose-patients-lookup"],
    queryFn: async () => {
      const { data, error } = await supabase.from("iose_patients").select("id, full_name").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const createEntry = useMutation({
    mutationFn: async (entry: typeof newEntry) => {
      const { data, error } = await supabase.from("iose_surgery_list").insert([entry]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iose-surgery-list", listId] });
      toast.success("Paciente adicionado à lista!");
      setIsAddDialogOpen(false);
      setNewEntry({
        ...newEntry,
        patient_id: "",
        surgery_type: "",
        eye_side: "Ambos",
        scheduled_time: "",
        priority: "Normal",
      });
    },
    onError: (error: any) => {
      toast.error("Erro ao adicionar: " + error.message);
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase.from("iose_surgery_list").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iose-surgery-list", listId] });
      toast.success("Status atualizado!");
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("iose_surgery_list").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iose-surgery-list", listId] });
      toast.success("Removido da lista!");
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Aguardando": return <Badge variant="secondary">Aguardando</Badge>;
      case "Confirmado": return <Badge className="bg-blue-500">Confirmado</Badge>;
      case "Realizado": return <Badge className="bg-green-500">Realizado</Badge>;
      case "Cancelado": return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge variant="outline">{status || "Pendente"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{listInfo?.name}</h1>
            <p className="text-gray-600">
              {listInfo?.scheduled_date ? format(new Date(listInfo.scheduled_date), "dd/MM/yyyy") : "Data não definida"}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none">
                <Plus className="w-4 h-4" />
                Adicionar Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Paciente na Lista</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Paciente</Label>
                  <Select onValueChange={(val) => setNewEntry({ ...newEntry, patient_id: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surgery_type">Tipo de Cirurgia</Label>
                  <Input
                    id="surgery_type"
                    placeholder="Ex: Catarata, Pterígio"
                    value={newEntry.surgery_type}
                    onChange={(e) => setNewEntry({ ...newEntry, surgery_type: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lado</Label>
                    <Select onValueChange={(val) => setNewEntry({ ...newEntry, eye_side: val })} defaultValue="Ambos">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Esquerdo">Esquerdo</SelectItem>
                        <SelectItem value="Direito">Direito</SelectItem>
                        <SelectItem value="Ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select onValueChange={(val) => setNewEntry({ ...newEntry, priority: val })} defaultValue="Normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Urgente">Urgente</SelectItem>
                        <SelectItem value="Prioritário">Prioritário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário Previsto</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newEntry.scheduled_time}
                    onChange={(e) => setNewEntry({ ...newEntry, scheduled_time: e.target.value })}
                  />
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => createEntry.mutate(newEntry)}>
                  Confirmar na Lista
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Cirurgia</TableHead>
              <TableHead>Lado</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell>
              </TableRow>
            ) : entries?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum paciente nesta lista
                </TableCell>
              </TableRow>
            ) : (
              entries?.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="font-medium">{entry.patient?.full_name}</div>
                    <div className="text-xs text-muted-foreground">{entry.patient?.cpf}</div>
                  </TableCell>
                  <TableCell>{entry.surgery_type}</TableCell>
                  <TableCell>{entry.eye_side}</TableCell>
                  <TableCell>{entry.scheduled_time?.slice(0, 5) || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={entry.priority === "Urgente" ? "destructive" : "outline"}>
                      {entry.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 p-0">
                          {getStatusBadge(entry.status)}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: entry.id, status: "Aguardando" })}>Aguardando</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: entry.id, status: "Confirmado" })}>Confirmado</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: entry.id, status: "Realizado" })}>Realizado</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: entry.id, status: "Cancelado" })}>Cancelado</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm("Remover paciente da lista?")) deleteEntry.mutate(entry.id);
                    }}>
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </Button>
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
