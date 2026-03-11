import { useState, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { Users, Scissors, ClipboardCheck, CalendarCheck, Calendar, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function StatCard({ icon: Icon, label, value, color, onClick }: {
  icon: React.ElementType; label: string; value: string | number; color: string; onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="glass-card rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}

const statusLabel: Record<string, string> = {
  pendente: "Pendente", agendada: "Agendada", aguardando: "Aguardando", realizada: "Realizada",
};
const statusColor: Record<string, string> = {
  pendente: "bg-warning/10 text-warning", agendada: "bg-info/10 text-info",
  aguardando: "bg-orange-500/10 text-orange-500", realizada: "bg-success/10 text-success",
};

type PeriodFilter = "today" | "week" | "month" | "year" | "all";

function getDateRange(period: PeriodFilter): { start: Date; end: Date } | null {
  if (period === "all") return null;
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "today":
      break;
    case "week":
      start.setDate(now.getDate() - now.getDay());
      end.setDate(start.getDate() + 6);
      break;
    case "month":
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
      break;
    case "year":
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      break;
  }
  return { start, end };
}

const periodLabels: Record<PeriodFilter, string> = {
  today: "Hoje", week: "Esta semana", month: "Este mês", year: "Este ano", all: "Todo período",
};

export default function Dashboard() {
  const { patients, surgeries, loading } = useApp();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodFilter>("month");

  const filteredSurgeries = useMemo(() => {
    const range = getDateRange(period);
    if (!range) return surgeries;
    return surgeries.filter(s => {
      const dateStr = s.scheduledDate || s.requestDate;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= range.start && d <= range.end;
    });
  }, [surgeries, period]);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;

  const scheduledSurgeries = filteredSurgeries.filter(s => s.status === "agendada").length;
  const completedSurgeries = filteredSurgeries.filter(s => s.status === "realizada").length;

  const upcomingSurgeries = filteredSurgeries
    .filter(s => s.status === "pendente" || s.status === "agendada" || s.status === "aguardando")
    .sort((a, b) => {
      const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : Infinity;
      const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : Infinity;
      return dateA - dateB;
    })
    .slice(0, 5);

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name ?? "Desconhecido";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel de Controle</h1>
          <p className="text-muted-foreground mt-1">Visão geral do sistema cirúrgico</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={period} onValueChange={v => setPeriod(v as PeriodFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(periodLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total de Pacientes" value={patients.length} color="bg-primary/10 text-primary" onClick={() => navigate("/pacientes")} />
        <StatCard icon={Scissors} label="Total de Cirurgias" value={filteredSurgeries.length} color="bg-info/10 text-info" onClick={() => navigate("/cirurgias")} />
        <StatCard icon={CalendarCheck} label="Cirurgias Agendadas" value={scheduledSurgeries} color="bg-warning/10 text-warning" onClick={() => navigate("/cirurgias")} />
        <StatCard icon={ClipboardCheck} label="Cirurgias Realizadas" value={completedSurgeries} color="bg-success/10 text-success" onClick={() => navigate("/cirurgias")} />
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Próximas Cirurgias</h2>
        </div>

        {upcomingSurgeries.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Nenhuma cirurgia agendada</p>
        ) : (
          <div className="space-y-3">
            {upcomingSurgeries.map((surgery, i) => {
              const progress = surgery.checklist.length > 0
                ? Math.round((surgery.checklist.filter(c => c.completed).length / surgery.checklist.length) * 100) : 0;
              return (
                <motion.div
                  key={surgery.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/cirurgias/${surgery.id}`)}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{getPatientName(surgery.patientId)}</p>
                    <p className="text-sm text-muted-foreground">{surgery.type} • {surgery.size === "pequena" ? "Pequena" : "Grande"}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{surgery.scheduledDate ? new Date(surgery.scheduledDate).toLocaleDateString("pt-BR") : surgery.requestDate ? `Sol: ${new Date(surgery.requestDate).toLocaleDateString("pt-BR")}` : "Sem data"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{progress}%</span>
                      </div>
                    </div>
                    <span className={`status-badge ${statusColor[surgery.status]}`}>{statusLabel[surgery.status]}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}