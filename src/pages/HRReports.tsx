import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Building, Briefcase, FileBarChart } from "lucide-react";
import { toast } from "sonner";

export default function HRReports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [staffByUnit, setStaffByUnit] = useState<any[]>([]);
  const [staffByCondition, setStaffByCondition] = useState<any[]>([]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Basic counts
      const [staffCount, unitsCount, deptsCount] = await Promise.all([
        supabase.from("staff").select("*", { count: 'exact', head: true }),
        supabase.from("units").select("*", { count: 'exact', head: true }),
        supabase.from("departments").select("*", { count: 'exact', head: true }),
      ]);

      setStats({
        staff: staffCount.count || 0,
        units: unitsCount.count || 0,
        departments: deptsCount.count || 0,
      });

      // Staff by Unit
      const { data: unitsData, error: unitsError } = await supabase
        .from("units")
        .select(`
          name,
          departments (
            staff (id)
          )
        `);

      if (unitsError) throw unitsError;

      const unitStats = unitsData.map(unit => {
        const totalStaff = unit.departments?.reduce((acc: number, dept: any) => acc + (dept.staff?.length || 0), 0) || 0;
        return { name: unit.name, count: totalStaff };
      }).filter(u => u.count > 0).sort((a, b) => b.count - a.count);

      setStaffByUnit(unitStats);

      // Staff by Condition
      const { data: conditionData, error: condError } = await supabase
        .from("staff")
        .select("condition");

      if (condError) throw condError;

      const condStats = conditionData.reduce((acc: any, curr: any) => {
        const cond = curr.condition || "NÃO INFORMADO";
        acc[cond] = (acc[cond] || 0) + 1;
        return acc;
      }, {});

      setStaffByCondition(Object.entries(condStats).map(([name, count]) => ({ name, count })));

    } catch (error: any) {
      toast.error("Erro ao carregar relatório: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Carregando dados do relatório...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios de RH</h1>
        <p className="text-gray-600">Análise quantitativa do quadro de pessoal.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.staff}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Unidades Ativas</CardTitle>
            <Building className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.units}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Departamentos</CardTitle>
            <Briefcase className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.departments}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Funcionários por Unidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffByUnit.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="w-5 h-5" />
              Funcionários por Vínculo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Vínculo</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffByCondition.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
