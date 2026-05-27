import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scissors, Plus, Calendar, Search, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function IoseSurgeryList() {
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
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ["iose-surgery-list", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("iose_surgery_list")
        .select(`
          *,
          patient:iose_patients(full_name, cpf)
        `)
        .order("scheduled_date", { ascending: false });
      
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
      queryClient.invalidateQueries({ queryKey: ["iose-surgery-list"] });
      toast.success("Cirurgia adicionada à lista!");
      setIsAddDialogOpen(false);
      setNewEntry({
        patient_id: "",
        surgery_type: "",
        eye_side: "Ambos",
        scheduled_date: "",
        scheduled_time: "",
        priority: "Normal",
      });
    },
    onError: (error: any) => {
      toast.error("Erro ao adicionar cirurgia: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Aguardando": return <Badge variant="secondary">Aguardando</Badge>;
      case "Confirmado": return <Badge className="bg-blue-500">Confirmado</Badge>;
      case "Realizado": return <Badge className="bg-green-500">Realizado</Badge>;
      case "Cancelado": return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lista de Cirurgia Iose</h1>
          <p className="text-gray-600">Montagem da lista e agendamentos</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4" />
              Adicionar à Lista
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Cirurgia na Lista</DialogTitle>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data Prevista</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEntry.scheduled_date}
                    onChange={(e) => setNewEntry({ ...newEntry, scheduled_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newEntry.scheduled_time}
                    onChange={(e) => setNewEntry({ ...newEntry, scheduled_time: e.target.value })}
                  />
                </div>
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => createEntry.mutate(newEntry)}>
                Salvar na Lista
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Cirurgia</TableHead>
              <TableHead>Lado</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
              </TableRow>
            ) : entries?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma cirurgia na lista
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
                  <TableCell>
                    {entry.scheduled_date ? format(new Date(entry.scheduled_date), "dd/MM/yyyy") : "-"}
                    {entry.scheduled_time && ` às ${entry.scheduled_time}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.priority === "Urgente" ? "destructive" : "outline"}>
                      {entry.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
