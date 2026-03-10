import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, Circle, Scissors, User, Calendar, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { SurgeryStatus } from "@/types";

const statusLabel: Record<SurgeryStatus, string> = {
  agendada: "Agendada", em_preparo: "Em preparo", realizada: "Realizada", cancelada: "Cancelada",
};
const statusColor: Record<SurgeryStatus, string> = {
  agendada: "bg-info/10 text-info", em_preparo: "bg-warning/10 text-warning",
  realizada: "bg-success/10 text-success", cancelada: "bg-destructive/10 text-destructive",
};

export default function SurgeryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { surgeries, patients, toggleChecklistItem, updateSurgery, deleteSurgery } = useApp();

  const surgery = surgeries.find(s => s.id === id);
  if (!surgery) return <div className="text-center py-12 text-muted-foreground">Cirurgia não encontrada</div>;

  const patient = patients.find(p => p.id === surgery.patientId);
  const completedCount = surgery.checklist.filter(c => c.completed).length;
  const totalCount = surgery.checklist.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir esta cirurgia?")) {
      deleteSurgery(surgery.id);
      navigate("/cirurgias");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cirurgias")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{surgery.type}</h1>
          <p className="text-muted-foreground">{surgery.size === "pequena" ? "Pequeno porte" : "Grande porte"}</p>
        </div>
        <Select value={surgery.status} onValueChange={v => updateSurgery(surgery.id, { status: v as SurgeryStatus })}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="agendada">Agendada</SelectItem>
            <SelectItem value="em_preparo">Em preparo</SelectItem>
            <SelectItem value="realizada">Realizada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Checklist */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-foreground">Checklist Pré-operatório</h2>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-sm font-medium text-foreground">{completedCount}/{totalCount}</span>
              </div>
            </div>

            {surgery.checklist.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum item no checklist</p>
            ) : (
              <div className="space-y-2">
                {surgery.checklist.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => toggleChecklistItem(surgery.id, item.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      item.completed ? "bg-success/5" : "bg-secondary/50 hover:bg-secondary"
                    }`}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={`text-sm flex-1 ${item.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {item.label}
                    </span>
                    {item.completedAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.completedAt).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {surgery.notes && (
            <div className="glass-card rounded-xl p-6">
              <h2 className="font-semibold text-foreground mb-3">Observações</h2>
              <p className="text-sm text-muted-foreground">{surgery.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Detalhes</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span
                  className="text-primary cursor-pointer hover:underline"
                  onClick={() => patient && navigate(`/pacientes/${patient.id}`)}
                >
                  {patient?.name ?? "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date(surgery.scheduledDate).toLocaleDateString("pt-BR")}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Scissors className="w-4 h-4" />
                {surgery.size === "pequena" ? "Pequeno porte" : "Grande porte"}
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h2 className="font-semibold text-foreground mb-3">Progresso</h2>
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeDasharray={`${progress}, 100`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{progress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
