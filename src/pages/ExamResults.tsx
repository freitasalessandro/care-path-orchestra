import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, Plus, CheckCircle, Clock, Filter, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const examSchema = z.object({
  patient_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  patient_cpf: z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
  exam_type: z.string().min(2, "Tipo de exame é obrigatório"),
});

type ExamFormValues = z.infer<typeof examSchema>;

export default function ExamResults() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      patient_name: "",
      patient_cpf: "",
      exam_type: "",
    },
  });

  const { data: exams, isLoading } = useQuery({
    queryKey: ["exam_results", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("exam_results")
        .select("*")
        .order("received_at", { ascending: false });

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
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error("Erro ao registrar exame: " + error.message);
    },
  });

  const collectExamMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("exam_results")
        .update({
          status: "collected",
          collected_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam_results"] });
      toast.success("Entrega de exame registrada!");
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

  const onSubmit = (values: ExamFormValues) => {
    createExamMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resultados de Exames</h1>
          <p className="text-muted-foreground">Controle de recebimento e entrega de exames</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Recebimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Chegada de Exame</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="patient_cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="exam_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Exame</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Sangue, Raio-X, etc" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={createExamMutation.isPending}>
                    {createExamMutation.isPending ? "Salvando..." : "Registrar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pesquisar Exame</CardTitle>
          <CardDescription>Busque por CPF ou nome do paciente para verificar disponibilidade</CardDescription>
          <div className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Digite o CPF ou nome do paciente..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Exame</TableHead>
                    <TableHead>Recebido em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    exams?.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.patient_name}</TableCell>
                        <TableCell>{exam.patient_cpf}</TableCell>
                        <TableCell>{exam.exam_type}</TableCell>
                        <TableCell>
                          {format(new Date(exam.received_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {exam.status === "available" ? (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1">
                              <Clock className="w-3 h-3" />
                              Disponível
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-700 gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Entregue
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {exam.status === "available" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                onClick={() => collectExamMutation.mutate(exam.id)}
                              >
                                Dar Baixa
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                if (confirm("Tem certeza que deseja excluir este registro?")) {
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
  );
}
