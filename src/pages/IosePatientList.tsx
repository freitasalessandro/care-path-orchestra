import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, UserPlus, Phone, CreditCard, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function IosePatientList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const [newPatient, setNewPatient] = useState({
    full_name: "",
    cpf: "",
    rg: "",
    phone: "",
    sus_card: "",
    birth_date: "",
    address: "",
    city: "",
    health_insurance: "",
    observations: "",
  });

  const { data: patients, isLoading } = useQuery({
    queryKey: ["iose-patients", searchTerm],
    queryFn: async () => {
      let query = supabase.from("iose_patients").select("*").order("full_name");
      if (searchTerm) {
        query = query.ilike("full_name", `%${searchTerm}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createPatient = useMutation({
    mutationFn: async (patient: typeof newPatient) => {
      const { data, error } = await supabase.from("iose_patients").insert([patient]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iose-patients"] });
      toast.success("Paciente cadastrado com sucesso!");
      setIsAddDialogOpen(false);
      setNewPatient({ 
        full_name: "", 
        cpf: "", 
        rg: "", 
        phone: "", 
        sus_card: "", 
        birth_date: "", 
        address: "", 
        city: "", 
        health_insurance: "", 
        observations: "" 
      });
    },
    onError: (error: any) => {
      toast.error("Erro ao cadastrar paciente: " + error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pacientes Iose</h1>
          <p className="text-gray-600">Gerencie o cadastro de pacientes da oftalmologia</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Novo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={newPatient.full_name}
                    onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={newPatient.cpf}
                    onChange={(e) => setNewPatient({ ...newPatient, cpf: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    value={newPatient.rg}
                    onChange={(e) => setNewPatient({ ...newPatient, rg: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={newPatient.birth_date}
                    onChange={(e) => setNewPatient({ ...newPatient, birth_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sus">Cartão SUS</Label>
                  <Input
                    id="sus"
                    value={newPatient.sus_card}
                    onChange={(e) => setNewPatient({ ...newPatient, sus_card: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="health_insurance">Convênio</Label>
                  <Input
                    id="health_insurance"
                    value={newPatient.health_insurance}
                    onChange={(e) => setNewPatient({ ...newPatient, health_insurance: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={newPatient.address}
                    onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={newPatient.city}
                    onChange={(e) => setNewPatient({ ...newPatient, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="observations">Observações</Label>
                  <Input
                    id="observations"
                    value={newPatient.observations}
                    onChange={(e) => setNewPatient({ ...newPatient, observations: e.target.value })}
                  />
                </div>
              </div>
              <Button className="w-full mt-4" onClick={() => createPatient.mutate(newPatient)}>
                Salvar Cadastro
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          placeholder="Buscar paciente por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Nascimento</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cartão SUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
              </TableRow>
            ) : patients?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum paciente encontrado
                </TableCell>
              </TableRow>
            ) : (
              patients?.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.full_name}</TableCell>
                  <TableCell>{patient.cpf || "-"}</TableCell>
                  <TableCell>
                    {patient.birth_date ? format(new Date(patient.birth_date), "dd/MM/yyyy") : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      {patient.phone || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3 h-3 text-muted-foreground" />
                      {patient.sus_card || "-"}
                    </div>
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
