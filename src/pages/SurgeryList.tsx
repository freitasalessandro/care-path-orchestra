import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { SurgerySize, SurgeryStatus } from "@/types";

const statusLabel: Record<SurgeryStatus, string> = {
  pendente: "Pendente", agendada: "Agendada", aguardando: "Aguardando", realizada: "Realizada",
};
const statusColor: Record<SurgeryStatus, string> = {
  pendente: "bg-warning/10 text-warning", agendada: "bg-info/10 text-info",
  aguardando: "bg-orange-500/10 text-orange-500", realizada: "bg-success/10 text-success",
};

export default function SurgeryList() {
  const { surgeries, patients, addSurgery, checklistTemplates, loading } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    patientId: "", type: "", size: "pequena" as SurgerySize, status: "pendente" as SurgeryStatus,
    requestDate: new Date().toISOString().split("T")[0], notes: "", templateId: "",
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;

  const filtered = surgeries.filter(s => {
    const patient = patients.find(p => p.id === s.patientId);
    const matchSearch = patient?.name.toLowerCase().includes(search.toLowerCase()) || s.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const template = checklistTemplates.find(t => t.id === form.templateId);
    const checklist = template
      ? template.items.map(item => ({ ...item, id: crypto.randomUUID(), completed: false }))
      : [];
    await addSurgery({ patientId: form.patientId, type: form.type, size: form.size, status: form.status, requestDate: form.requestDate, scheduledDate: "", notes: form.notes, waitingReason: "", checklist });
    setForm({ patientId: "", type: "", size: "pequena", status: "pendente", requestDate: new Date().toISOString().split("T")[0], notes: "", templateId: "" });
    setOpen(false);
    toast.success("Cirurgia registrada!");
  };

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cirurgias</h1>
          <p className="text-muted-foreground mt-1">{surgeries.length} cirurgias registradas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nova Cirurgia</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar Cirurgia</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Paciente</Label>
                <Select value={form.patientId} onValueChange={v => setForm(f => ({ ...f, patientId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                  <SelectContent>
                    {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Cirurgia</Label>
                  <Select value={form.templateId} onValueChange={v => {
                    const tpl = checklistTemplates.find(t => t.id === v);
                    setForm(f => ({ ...f, templateId: v, type: tpl?.name ?? "" }));
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione a cirurgia" /></SelectTrigger>
                    <SelectContent>
                      {checklistTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.surgeryType})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Porte</Label>
                  <Select value={form.size} onValueChange={v => setForm(f => ({ ...f, size: v as SurgerySize }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pequena">Pequena</SelectItem>
                      <SelectItem value="grande">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data da Solicitação</Label>
                  <Input type="date" value={form.requestDate} onChange={e => setForm(f => ({ ...f, requestDate: e.target.value }))} required />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit">Registrar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por paciente ou tipo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="agendada">Agendada</SelectItem>
            <SelectItem value="aguardando">Aguardando</SelectItem>
            <SelectItem value="realizada">Realizada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {filtered.map((surgery, i) => {
          const progress = surgery.checklist.length > 0
            ? Math.round((surgery.checklist.filter(c => c.completed).length / surgery.checklist.length) * 100) : 0;
          return (
            <motion.div
              key={surgery.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/cirurgias/${surgery.id}`)}
              className="glass-card rounded-xl p-4 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Scissors className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{surgery.type}</p>
                    <p className="text-sm text-muted-foreground">{getPatientName(surgery.patientId)} • {surgery.size === "pequena" ? "Pequena" : "Grande"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-foreground">{surgery.requestDate ? new Date(surgery.requestDate + "T00:00:00").toLocaleDateString("pt-BR") : "Sem data"}</p>
                    {surgery.scheduledDate && <p className="text-xs text-muted-foreground">Agend: {new Date(surgery.scheduledDate + "T00:00:00").toLocaleDateString("pt-BR")}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{progress}%</span>
                    </div>
                  </div>
                  <span className={`status-badge ${statusColor[surgery.status]}`}>{statusLabel[surgery.status]}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Scissors className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma cirurgia encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
