export type PatientStatus = "ativo" | "aguardando" | "cirurgia_realizada";
export type SurgerySize = "pequena" | "grande";
export type SurgeryStatus = "agendada" | "em_preparo" | "realizada" | "cancelada";

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  birthDate: string;
  address: string;
  status: PatientStatus;
  notes: string;
  createdAt: string;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  surgeryType: string;
  items: Omit<ChecklistItem, "completed" | "completedAt">[];
}

export interface Surgery {
  id: string;
  patientId: string;
  type: string;
  size: SurgerySize;
  status: SurgeryStatus;
  scheduledDate: string;
  notes: string;
  checklist: ChecklistItem[];
  createdAt: string;
}
