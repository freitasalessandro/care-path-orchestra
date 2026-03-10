import React, { createContext, useContext, useState, useCallback } from "react";
import type { Patient, Surgery, ChecklistTemplate, ChecklistItem } from "@/types";

interface AppState {
  patients: Patient[];
  surgeries: Surgery[];
  checklistTemplates: ChecklistTemplate[];
  addPatient: (patient: Omit<Patient, "id" | "createdAt" | "attachments">) => Patient;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  addSurgery: (surgery: Omit<Surgery, "id" | "createdAt">) => Surgery;
  updateSurgery: (id: string, data: Partial<Surgery>) => void;
  deleteSurgery: (id: string) => void;
  toggleChecklistItem: (surgeryId: string, itemId: string) => void;
  addChecklistTemplate: (template: Omit<ChecklistTemplate, "id">) => void;
  addAttachment: (patientId: string, attachment: Omit<Patient["attachments"][0], "id" | "uploadedAt">) => void;
}

const AppContext = createContext<AppState | null>(null);

const defaultTemplates: ChecklistTemplate[] = [
  {
    id: "t1",
    name: "Cirurgia Pequena - Padrão",
    surgeryType: "pequena",
    items: [
      { id: "t1i1", label: "Exames laboratoriais (hemograma, coagulograma)" },
      { id: "t1i2", label: "Avaliação pré-anestésica" },
      { id: "t1i3", label: "Termo de consentimento assinado" },
      { id: "t1i4", label: "Jejum de 8 horas confirmado" },
      { id: "t1i5", label: "Reserva de sala cirúrgica" },
    ],
  },
  {
    id: "t2",
    name: "Cirurgia Grande - Padrão",
    surgeryType: "grande",
    items: [
      { id: "t2i1", label: "Exames laboratoriais completos" },
      { id: "t2i2", label: "Exames de imagem (raio-x, tomografia)" },
      { id: "t2i3", label: "Avaliação cardiológica" },
      { id: "t2i4", label: "Avaliação pré-anestésica" },
      { id: "t2i5", label: "Reserva de sangue/hemoderivados" },
      { id: "t2i6", label: "Termo de consentimento assinado" },
      { id: "t2i7", label: "Internação pré-operatória" },
      { id: "t2i8", label: "Jejum de 8 horas confirmado" },
      { id: "t2i9", label: "Reserva de UTI pós-operatória" },
      { id: "t2i10", label: "Reserva de sala cirúrgica" },
    ],
  },
];

const samplePatients: Patient[] = [
  {
    id: "p1", name: "Maria Silva", cpf: "123.456.789-00", phone: "(11) 98765-4321",
    email: "maria@email.com", birthDate: "1985-03-15", address: "Rua das Flores, 123",
    status: "aguardando", notes: "Paciente hipertensa", createdAt: "2026-01-10", attachments: [],
  },
  {
    id: "p2", name: "João Santos", cpf: "987.654.321-00", phone: "(11) 91234-5678",
    email: "joao@email.com", birthDate: "1972-08-22", address: "Av. Brasil, 456",
    status: "ativo", notes: "Diabético tipo 2", createdAt: "2026-02-05", attachments: [],
  },
  {
    id: "p3", name: "Ana Oliveira", cpf: "456.789.123-00", phone: "(11) 99876-5432",
    email: "ana@email.com", birthDate: "1990-11-03", address: "Rua São Paulo, 789",
    status: "cirurgia_realizada", notes: "", createdAt: "2026-02-20", attachments: [],
  },
];

const sampleSurgeries: Surgery[] = [
  {
    id: "s1", patientId: "p1", type: "Herniorrafia", size: "pequena", status: "em_preparo",
    scheduledDate: "2026-03-20", notes: "Hérnia inguinal direita", createdAt: "2026-02-28",
    checklist: defaultTemplates[0].items.map((item, i) => ({
      ...item, id: `s1i${i}`, completed: i < 2, completedAt: i < 2 ? "2026-03-05" : undefined,
    })),
  },
  {
    id: "s2", patientId: "p2", type: "Colecistectomia", size: "grande", status: "agendada",
    scheduledDate: "2026-04-10", notes: "Cálculos biliares múltiplos", createdAt: "2026-03-01",
    checklist: defaultTemplates[1].items.map((item, i) => ({
      ...item, id: `s2i${i}`, completed: i < 3, completedAt: i < 3 ? "2026-03-08" : undefined,
    })),
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(samplePatients);
  const [surgeries, setSurgeries] = useState<Surgery[]>(sampleSurgeries);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>(defaultTemplates);

  const addPatient = useCallback((data: Omit<Patient, "id" | "createdAt" | "attachments">) => {
    const patient: Patient = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(), attachments: [] };
    setPatients(prev => [...prev, patient]);
    return patient;
  }, []);

  const updatePatient = useCallback((id: string, data: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const deletePatient = useCallback((id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
    setSurgeries(prev => prev.filter(s => s.patientId !== id));
  }, []);

  const addSurgery = useCallback((data: Omit<Surgery, "id" | "createdAt">) => {
    const surgery: Surgery = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setSurgeries(prev => [...prev, surgery]);
    return surgery;
  }, []);

  const updateSurgery = useCallback((id: string, data: Partial<Surgery>) => {
    setSurgeries(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }, []);

  const deleteSurgery = useCallback((id: string) => {
    setSurgeries(prev => prev.filter(s => s.id !== id));
  }, []);

  const toggleChecklistItem = useCallback((surgeryId: string, itemId: string) => {
    setSurgeries(prev => prev.map(s => {
      if (s.id !== surgeryId) return s;
      return {
        ...s,
        checklist: s.checklist.map(item =>
          item.id === itemId
            ? { ...item, completed: !item.completed, completedAt: !item.completed ? new Date().toISOString() : undefined }
            : item
        ),
      };
    }));
  }, []);

  const addChecklistTemplate = useCallback((template: Omit<ChecklistTemplate, "id">) => {
    setChecklistTemplates(prev => [...prev, { ...template, id: crypto.randomUUID() }]);
  }, []);

  const addAttachment = useCallback((patientId: string, attachment: Omit<Patient["attachments"][0], "id" | "uploadedAt">) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        attachments: [...p.attachments, { ...attachment, id: crypto.randomUUID(), uploadedAt: new Date().toISOString() }],
      };
    }));
  }, []);

  return (
    <AppContext.Provider value={{
      patients, surgeries, checklistTemplates,
      addPatient, updatePatient, deletePatient,
      addSurgery, updateSurgery, deleteSurgery,
      toggleChecklistItem, addChecklistTemplate, addAttachment,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
