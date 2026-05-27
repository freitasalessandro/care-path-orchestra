import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Scissors, Calendar, CheckCircle2 } from "lucide-react";

export default function IoseReports() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["iose-report-stats"],
    queryFn: async () => {
      const { count: totalPatients } = await supabase.from("iose_patients").select("*", { count: "exact", head: true });
      const { count: totalSurgeries } = await supabase.from("iose_surgery_list").select("*", { count: "exact", head: true });
      const { count: completedSurgeries } = await supabase.from("iose_surgery_list").select("*", { count: "exact", head: true }).eq("status", "Realizado");
      const { count: activeLists } = await supabase.from("iose_lists").select("*", { count: "exact", head: true }).eq("status", "Ativa");

      return {
        patients: totalPatients || 0,
        surgeries: totalSurgeries || 0,
        completed: completedSurgeries || 0,
        lists: activeLists || 0,
      };
    },
  });

  const { data: recentSurgeries } = useQuery({
    queryKey: ["iose-recent-surgeries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("iose_surgery_list")
        .select(`
          *,
          patient:iose_patients(full_name),
          list:iose_lists(name)
        `)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Relatórios IOSE</h1>
        <p className="text-gray-600">Visão geral e estatísticas do módulo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Cadastrados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.patients || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Cirurgias</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.surgeries || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cirurgias Realizadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Listas Ativas</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.lists || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-bold mb-4">Últimos Lançamentos</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Lista</TableHead>
              <TableHead>Cirurgia</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentSurgeries?.map((surgery) => (
              <TableRow key={surgery.id}>
                <TableCell className="font-medium">{surgery.patient?.full_name}</TableCell>
                <TableCell>{surgery.list?.name || "Sem lista"}</TableCell>
                <TableCell>{surgery.surgery_type}</TableCell>
                <TableCell>{surgery.status || "Aguardando"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
