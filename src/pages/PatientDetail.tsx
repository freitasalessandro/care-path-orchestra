import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Paperclip, Scissors, Upload, Trash2, Plus, CreditCard, Pencil } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PatientStatus } from "@/types";

const statusLabel: Record<PatientStatus, string> = {
  ativo: "Ativo", aguardando: "Aguardando", cirurgia_realizada: "Cirurgia Realizada",
};
const statusColor: Record<PatientStatus, string> = {
  ativo: "bg-success/10 text-success", aguardando: "bg-warning/10 text-warning", cirurgia_realizada: "bg-info/10 text-info",
};

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients, surgeries, addAttachment, deletePatient, updatePatient } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);

  const patient = patients.find(p => p.id === id);
  if (!patient) return <div className="text-center py-12 text-muted-foreground">Paciente não encontrado</div>;

  const patientSurgeries = surgeries.filter(s => s.patientId === patient.id);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      await addAttachment(patient.id, { name: file.name, type: file.type, size: file.size, url: URL.createObjectURL(file) });
    }
    toast.success("Arquivo(s) anexado(s)!");
  };

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja excluir este paciente?")) {
      await deletePatient(patient.id);
      navigate("/pacientes");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/pacientes")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{patient.name}</h1>
          <p className="text-muted-foreground">CPF: {patient.cpf} {patient.susCard && `• SUS: ${patient.susCard}`}</p>
        </div>
        <span className={`status-badge ${statusColor[patient.status]}`}>{statusLabel[patient.status]}</span>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Pencil className="w-4 h-4 mr-1" />Editar</Button>
        <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h2 className="font-semibold text-foreground mb-4">Informações Pessoais</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{patient.phone || "—"}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" />{patient.email || "—"}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" />{patient.birthDate ? new Date(patient.birthDate).toLocaleDateString("pt-BR") : "—"}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" />{patient.address || "—"}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><CreditCard className="w-4 h-4" />SUS: {patient.susCard || "—"}</div>
            </div>
            {patient.notes && (
              <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
                <p className="text-sm text-foreground">{patient.notes}</p>
              </div>
            )}
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Scissors className="w-4 h-4 text-primary" />Cirurgias ({patientSurgeries.length})
              </h2>
              <Button size="sm" onClick={() => navigate(`/cirurgias`)}>
                <Plus className="w-3 h-3 mr-1" />Nova Cirurgia
              </Button>
            </div>
            {patientSurgeries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma cirurgia registrada</p>
            ) : (
              <div className="space-y-2">
                {patientSurgeries.map(s => {
                  const progress = s.checklist.length > 0 ? Math.round((s.checklist.filter(c => c.completed).length / s.checklist.length) * 100) : 0;
                  return (
                    <div key={s.id} onClick={() => navigate(`/cirurgias/${s.id}`)}
                      className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">{s.type}</p>
                        <p className="text-xs text-muted-foreground">{new Date(s.scheduledDate).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{progress}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-primary" />Anexos ({patient.attachments.length})
              </h2>
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="w-3 h-3 mr-1" />Anexar
              </Button>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
            </div>
            {patient.attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum anexo</p>
            ) : (
              <div className="space-y-2">
                {patient.attachments.map(a => (
                  <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-sm transition-colors">
                    <Paperclip className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate text-foreground">{a.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{(a.size / 1024).toFixed(0)}KB</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <EditPatientDialog patient={patient} open={editOpen} onOpenChange={setEditOpen} onSave={updatePatient} />
    </div>
  );
}

function EditPatientDialog({ patient, open, onOpenChange, onSave }: {
  patient: import("@/types").Patient;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (id: string, data: Partial<import("@/types").Patient>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: patient.name, susCard: patient.susCard, cpf: patient.cpf, phone: patient.phone,
    email: patient.email, birthDate: patient.birthDate, address: patient.address,
    status: patient.status as PatientStatus, notes: patient.notes,
  });

  // Sync form when patient changes or dialog opens
  const [prevId, setPrevId] = useState(patient.id);
  if (patient.id !== prevId) {
    setPrevId(patient.id);
    setForm({ name: patient.name, susCard: patient.susCard, cpf: patient.cpf, phone: patient.phone, email: patient.email, birthDate: patient.birthDate, address: patient.address, status: patient.status as PatientStatus, notes: patient.notes });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(patient.id, form);
    onOpenChange(false);
    toast.success("Paciente atualizado!");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (v) setForm({ name: patient.name, susCard: patient.susCard, cpf: patient.cpf, phone: patient.phone, email: patient.email, birthDate: patient.birthDate, address: patient.address, status: patient.status as PatientStatus, notes: patient.notes });
      onOpenChange(v);
    }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Paciente</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome completo</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <Label>Cartão SUS</Label>
              <Input value={form.susCard} onChange={e => setForm(f => ({ ...f, susCard: e.target.value }))} />
            </div>
            <div>
              <Label>CPF</Label>
              <Input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} required />
            </div>
            <div>
              <Label>Data de Nascimento</Label>
              <Input type="date" value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Endereço</Label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as PatientStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="aguardando">Aguardando</SelectItem>
                  <SelectItem value="cirurgia_realizada">Cirurgia Realizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
          </div>
          <Button type="submit" className="w-full">Salvar Alterações</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
