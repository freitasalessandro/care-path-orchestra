import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, Users, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function SisapiDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["sisapi-stats"],
    queryFn: async () => {
      const [docs, pending, users] = await Promise.all([
        supabase.from("sisapi_documents").select("id", { count: "exact", head: true }),
        supabase.from("sisapi_documents").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
        supabase.from("sisapi_profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
      ]);

      return {
        totalDocs: docs.count || 0,
        pendingDocs: pending.count || 0,
        activeUsers: users.count || 0,
        completedDocs: 0, // Placeholder
      };
    },
  });

  const cards = [
    { title: "Documentos Totais", value: stats?.totalDocs || 0, icon: FileText, color: "text-blue-600" },
    { title: "Pendências", value: stats?.pendingDocs || 0, icon: Clock, color: "text-amber-600" },
    { title: "Usuários Ativos", value: stats?.activeUsers || 0, icon: Users, color: "text-emerald-600" },
    { title: "Finalizados", value: stats?.completedDocs || 0, icon: CheckCircle2, color: "text-indigo-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard de Gestão</h1>
        <p className="text-muted-foreground">Bem-vindo ao SISAPI - Sistema de Apoio à Gestão.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
