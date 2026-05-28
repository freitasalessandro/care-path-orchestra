import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDesc } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, Plus, CheckCircle, Clock, Trash2, UserCheck, UserCog } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const examSchema = z.object({
  patient_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  patient_cpf: z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
  exam_type: z.string().min(2, "Tipo de exame é obrigatório"),
});

const deliverySchema = z.object({
  recipient_name: z.string().min(3, "Nome do retirante é obrigatório"),
  recipient_document: z.string().min(5, "Documento do retirante é obrigatório"),
});

type ExamFormValues = z.infer<typeof examSchema>;
type DeliveryFormValues = z.infer<typeof deliverySchema>;

export default function ExamResults() {
  const { data: profile } = useQuery({
    queryKey: ["sisapi-profile"],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;
      const { data } = await supabase.from("sisapi_profiles").select("*").eq("id", authUser.id).single();
      return { ...data, email: authUser.email };

    }
  });

  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("available");
  
  const queryClient = useQueryClient();

  const registerForm = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      patient_name: "",
      patient_cpf: "",
      exam_type: "",
    },
  });

  const deliveryForm = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      recipient_name: "",
      recipient_document: "",
    },
  });

  const { data: exams, isLoading } = useQuery({
    queryKey: ["exam_results", searchTerm, activeTab],
    queryFn: async () => {
      let query = supabase
        .from("exam_results")
        .select("*")
        .eq("status", activeTab)
        .order(activeTab === "available" ? "received_at" : "collected_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`patient_cpf.ilike.%${searchTerm}%,patient_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createExamMutation = useMutation({
    mutationFn: async (values: ExamFormValues) => {
      const { data, error } = await supabase
        .from("exam_results")
        .insert([{
          patient_name: values.patient_name,
          patient_cpf: values.patient_cpf,
          exam_type: values.exam_type,
          status: "available",
          received_at: new Date().toISOString(),
        }]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam_results"] });
      toast.success("Exame registrado com sucesso!");
      setIsRegisterDialogOpen(false);
      registerForm.reset();
    },
    onError: (error) => {
      toast.error("Erro ao registrar exame: " + error.message);
    },
  });

  const collectExamMutation = useMutation({
    mutationFn: async (values: DeliveryFormValues) => {
      if (!selectedExamId) return;
      
      const { data, error } = await supabase
        .from("exam_results")
        .update({
          status: "collected",
          collected_at: new Date().toISOString(),
        })
        .eq("id", selectedExamId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam_results"] });
      toast.success("Entrega de exame registrada com sucesso!");
      setIsDeliveryDialogOpen(false);
      setSelectedExamId(null);
      deliveryForm.reset();
    },
    onError: (error) => {
      toast.error("Erro ao registrar entrega: " + error.message);
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("exam_results")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam_results"] });
      toast.success("Registro excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir registro: " + error.message);
    },
  });

  const onRegisterSubmit = (values: ExamFormValues) => {
    createExamMutation.mutate(values);
  };

  const onDeliverySubmit = (values: DeliveryFormValues) => {
    collectExamMutation.mutate(values);
  };

  const handleCollectClick = (examId: string, patientName: string) => {
    setSelectedExamId(examId);
    deliveryForm.setValue("recipient_name", patientName); // Default to patient's name
    setIsDeliveryDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resultados de Exames</h1>
            <p className="text-muted-foreground">Controle de recebimento e entrega de exames na secretaria</p>
          </div>
          {profile?.is_admin && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/usuarios")}>
              <UserCog className="w-4 h-4" />
              Gestão de Usuários
            </Button>
          )}
        </div>

        <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Registrar Chegada
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Chegada de Exame</DialogTitle>
              <DialogDescription>Insira os dados do exame recebido na secretaria.</DialogDescription>
            </DialogHeader>
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={registerForm.control}
                  name="patient_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Paciente</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="patient_cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF do Paciente</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="exam_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Exame</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Hemograma, Raio-X de Tórax" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={createExamMutation.isPending}>
                    {createExamMutation.isPending ? "Registrando..." : "Confirmar Recebimento"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <CardTitle>Listagem de Exames</CardTitle>
                <CardDesc>Gerencie os exames disponíveis e as entregas realizadas.</CardDesc>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por CPF ou nome..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6 border-b pb-1">
              <button 
                onClick={() => setActiveTab("available")}
                className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === "available" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                Disponíveis
              </button>
              <button 
                onClick={() => setActiveTab("collected")}
                className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === "collected" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                Já Retirados
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Exame</TableHead>
                      <TableHead>{activeTab === "available" ? "Chegada" : "Entrega"}</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          {searchTerm ? "Nenhum resultado para a busca." : activeTab === "available" ? "Não há exames aguardando retirada." : "Nenhum exame foi entregue ainda."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      exams?.map((exam) => (
                        <TableRow key={exam.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            <div>
                              <p>{exam.patient_name}</p>
                              {activeTab === "collected" && (
                                <p className="text-xs text-muted-foreground font-normal mt-0.5">Entregue com sucesso</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-mono">{exam.patient_cpf}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal border-slate-200">
                              {exam.exam_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              {activeTab === "available" ? (
                                <>
                                  <Clock className="w-3.5 h-3.5" />
                                  {format(new Date(exam.received_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                  {exam.collected_at ? format(new Date(exam.collected_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR }) : "-"}
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {activeTab === "available" && (
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 h-8 gap-1.5"
                                  onClick={() => handleCollectClick(exam.id, exam.patient_name)}
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Retirar
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja excluir este registro permanentemente?")) {
                                    deleteExamMutation.mutate(exam.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Entrega de Exame</DialogTitle>
            <DialogDescription>
              Preencha os dados da pessoa que está retirando o resultado.
            </DialogDescription>
          </DialogHeader>
          <Form {...deliveryForm}>
            <form onSubmit={deliveryForm.handleSubmit(onDeliverySubmit)} className="space-y-4 pt-4">
              <FormField
                control={deliveryForm.control}
                name="recipient_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de quem está retirando</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={deliveryForm.control}
                name="recipient_document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento (RG ou CPF)</FormLabel>
                    <FormControl>
                      <Input placeholder="Número do documento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDeliveryDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={collectExamMutation.isPending}
                >
                  {collectExamMutation.isPending ? "Processando..." : "Confirmar Entrega"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
