import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, Briefcase, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export default function HRDashboard() {
  const [counts, setCounts] = useState({ staff: 0, units: 0, depts: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      const [s, u, d] = await Promise.all([
        supabase.from("staff").select("*", { count: 'exact', head: true }),
        supabase.from("units").select("*", { count: 'exact', head: true }),
        supabase.from("departments").select("*", { count: 'exact', head: true }),
      ]);
      setCounts({
        staff: s.count || 0,
        units: u.count || 0,
        depts: d.count || 0,
      });
    };
    fetchCounts();
  }, []);

  const stats = [
    { label: "Total Funcionários", value: counts.staff.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "UBS / Unidades", value: counts.units.toString(), icon: Building, color: "text-green-600", bg: "bg-green-100" },
    { label: "Setores", value: counts.depts.toString(), icon: Briefcase, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Ativos", value: counts.staff.toString(), icon: UserCheck, color: "text-orange-600", bg: "bg-orange-100" },
  ];


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel de Recursos Humanos</h1>
        <p className="text-gray-600">Visão geral do quadro de pessoal e unidades.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recém Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum funcionário cadastrado recentemente.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
