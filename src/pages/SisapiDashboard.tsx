import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, Users, CheckCircle2, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SisapiDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["sisapi-stats"],
    queryFn: async () => {
      const [docs, pending, users, completed] = await Promise.all([
        supabase.from("sisapi_documents").select("id", { count: "exact", head: true }),
        supabase.from("sisapi_documents").select("id", { count: "exact", head: true }).eq("assigned_to", user?.id).eq("status", "pending_approval"),
        supabase.from("sisapi_profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("sisapi_documents").select("id", { count: "exact", head: true }).eq("status", "completed"),
      ]);

      return {
        totalDocs: docs.count || 0,
        pendingDocs: pending.count || 0,
        activeUsers: users.count || 0,
        completedDocs: completed.count || 0,
      };
    },
  });

  const { data: recentDocs } = useQuery({
    queryKey: ["sisapi-recent-docs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sisapi_documents")
        .select(`
          *,
          author:author_id(full_name)
        `)
        .or(`author_id.eq.${user?.id},assigned_to.eq.${user?.id}`)
        .order("updated_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const cards = [
    { title: "Documentos Totais", value: stats?.totalDocs || 0, icon: FileText, color: "text-blue-600" },
    { title: "Meus Pendentes", value: stats?.pendingDocs || 0, icon: Clock, color: "text-amber-600" },
    { title: "Usuários Ativos", value: stats?.activeUsers || 0, icon: Users, color: "text-emerald-600" },
    { title: "Finalizados", value: stats?.completedDocs || 0, icon: CheckCircle2, color: "text-indigo-600" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Concluído</Badge>;
      case 'pending_approval': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">Pendente</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-jakarta">Painel de Gestão</h1>
        <p className="text-muted-foreground">Sistema de Apoio à Gestão - SISAPI</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Card key={card.title} className="border-none shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-slate-50 ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Documentos Recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/documentos" className="text-blue-600">Ver todos <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md overflow-hidden border">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDocs?.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <Link to={`/documentos/editar/${doc.id}`} className="hover:underline">{doc.title}</Link>
                      </TableCell>
                      <TableCell className="text-slate-600">{doc.author?.full_name}</TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell className="text-right text-slate-500">
                        {format(new Date(doc.updated_at), "dd/MM/yy", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentDocs?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum documento recente.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white overflow-hidden">
          <CardHeader className="bg-slate-800 text-white">
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col">
              <Link to="/documentos/novo" className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b">
                <div className="p-2 rounded bg-blue-100 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold">Novo Documento</div>
                  <div className="text-xs text-muted-foreground">Criar ofício, memorando ou processo</div>
                </div>
              </Link>
              <Link to="/pendentes" className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b">
                <div className="p-2 rounded bg-amber-100 text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold">Meus Pendentes</div>
                  <div className="text-xs text-muted-foreground">Assinar documentos recebidos</div>
                </div>
              </Link>
              <Link to="/acervo" className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                <div className="p-2 rounded bg-indigo-100 text-indigo-600">
                  <Library className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold">Acervo Digital</div>
                  <div className="text-xs text-muted-foreground">Consultar arquivos digitalizados</div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
