import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Patient, Surgery, ChecklistTemplate, Attachment } from "@/types";

interface PrintSettings {
  id: string;
  logoUrl: string | null;
  headerTitle: string;
  headerSubtitle: string | null;
  footerText: string | null;
  showLogo: boolean;
  showHeader: boolean;
  showFooter: boolean;
}

interface AppState {
  patients: Patient[];
  surgeries: Surgery[];
  checklistTemplates: ChecklistTemplate[];
  printSettings: PrintSettings | null;
  loading: boolean;
  addPatient: (patient: Omit<Patient, "id" | "createdAt" | "attachments">) => Promise<Patient>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  addSurgery: (surgery: Omit<Surgery, "id" | "createdAt">) => Promise<Surgery>;
  updateSurgery: (id: string, data: Partial<Surgery>) => Promise<void>;
  deleteSurgery: (id: string) => Promise<void>;
  toggleChecklistItem: (surgeryId: string, itemId: string) => Promise<void>;
  addChecklistTemplate: (template: Omit<ChecklistTemplate, "id">) => Promise<void>;
  deleteChecklistTemplate: (id: string) => Promise<void>;
  addAttachment: (patientId: string, attachment: Omit<Attachment, "id" | "uploadedAt">) => Promise<void>;
  updatePrintSettings: (settings: Partial<PrintSettings>) => Promise<void>;
  uploadLogo: (file: File) => Promise<string>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

function mapPatient(row: any): Patient {
  return {
    id: row.id, name: row.name, susCard: row.sus_card ?? "", cpf: row.cpf, phone: row.phone ?? "",
    email: row.email ?? "", birthDate: row.birth_date ?? "", address: row.address ?? "",
    status: row.status, notes: row.notes ?? "", createdAt: row.created_at, attachments: [],
  };
}

function mapSurgery(row: any): Surgery {
  return {
    id: row.id, patientId: row.patient_id, type: row.type, size: row.size,
    status: row.status, scheduledDate: row.scheduled_date, notes: row.notes ?? "",
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    createdAt: row.created_at,
  };
}

function mapTemplate(row: any): ChecklistTemplate {
  return {
    id: row.id, name: row.name, surgeryType: row.surgery_type,
    items: Array.isArray(row.items) ? row.items : [],
  };
}

function mapPrintSettings(row: any): PrintSettings {
  return {
    id: row.id, logoUrl: row.logo_url, headerTitle: row.header_title ?? "",
    headerSubtitle: row.header_subtitle, footerText: row.footer_text,
    showLogo: row.show_logo ?? true, showHeader: row.show_header ?? true, showFooter: row.show_footer ?? true,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  const [printSettings, setPrintSettings] = useState<PrintSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setLoading(true);
    const [pRes, sRes, tRes, prRes, aRes] = await Promise.all([
      supabase.from("patients").select("*").order("created_at", { ascending: false }),
      supabase.from("surgeries").select("*").order("scheduled_date", { ascending: true }),
      supabase.from("checklist_templates").select("*").order("created_at"),
      supabase.from("print_settings").select("*").limit(1).single(),
      supabase.from("patient_attachments").select("*"),
    ]);

    const pats = (pRes.data ?? []).map(mapPatient);
    const attachments = aRes.data ?? [];
    pats.forEach(p => {
      p.attachments = attachments.filter((a: any) => a.patient_id === p.id).map((a: any) => ({
        id: a.id, name: a.name, type: a.file_type ?? "", size: a.file_size ?? 0, url: a.url, uploadedAt: a.uploaded_at,
      }));
    });

    setPatients(pats);
    setSurgeries((sRes.data ?? []).map(mapSurgery));
    setChecklistTemplates((tRes.data ?? []).map(mapTemplate));
    if (prRes.data) setPrintSettings(mapPrintSettings(prRes.data));
    setLoading(false);
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  const addPatient = useCallback(async (data: Omit<Patient, "id" | "createdAt" | "attachments">) => {
    const { data: row, error } = await supabase.from("patients").insert({
      name: data.name, sus_card: data.susCard || null, cpf: data.cpf, phone: data.phone || null, email: data.email || null,
      birth_date: data.birthDate || null, address: data.address || null, status: data.status, notes: data.notes || null,
    }).select().single();
    if (error) throw error;
    const patient = mapPatient(row);
    setPatients(prev => [patient, ...prev]);
    return patient;
  }, []);

  const updatePatient = useCallback(async (id: string, data: Partial<Patient>) => {
    const update: any = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.cpf !== undefined) update.cpf = data.cpf;
    if (data.phone !== undefined) update.phone = data.phone || null;
    if (data.email !== undefined) update.email = data.email || null;
    if (data.birthDate !== undefined) update.birth_date = data.birthDate || null;
    if (data.address !== undefined) update.address = data.address || null;
    if (data.status !== undefined) update.status = data.status;
    if (data.notes !== undefined) update.notes = data.notes || null;
    await supabase.from("patients").update(update).eq("id", id);
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const deletePatient = useCallback(async (id: string) => {
    await supabase.from("patients").delete().eq("id", id);
    setPatients(prev => prev.filter(p => p.id !== id));
    setSurgeries(prev => prev.filter(s => s.patientId !== id));
  }, []);

  const addSurgery = useCallback(async (data: Omit<Surgery, "id" | "createdAt">) => {
    const { data: row, error } = await supabase.from("surgeries").insert({
      patient_id: data.patientId, type: data.type, size: data.size, status: data.status,
      scheduled_date: data.scheduledDate, notes: data.notes || null, checklist: data.checklist as any,
    }).select().single();
    if (error) throw error;
    const surgery = mapSurgery(row);
    setSurgeries(prev => [...prev, surgery]);
    return surgery;
  }, []);

  const updateSurgery = useCallback(async (id: string, data: Partial<Surgery>) => {
    const update: any = {};
    if (data.status !== undefined) update.status = data.status;
    if (data.checklist !== undefined) update.checklist = data.checklist;
    if (data.notes !== undefined) update.notes = data.notes;
    if (data.scheduledDate !== undefined) update.scheduled_date = data.scheduledDate;
    await supabase.from("surgeries").update(update).eq("id", id);
    setSurgeries(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }, []);

  const deleteSurgery = useCallback(async (id: string) => {
    await supabase.from("surgeries").delete().eq("id", id);
    setSurgeries(prev => prev.filter(s => s.id !== id));
  }, []);

  const toggleChecklistItem = useCallback(async (surgeryId: string, itemId: string) => {
    const surgery = surgeries.find(s => s.id === surgeryId);
    if (!surgery) return;
    const newChecklist = surgery.checklist.map(item =>
      item.id === itemId
        ? { ...item, completed: !item.completed, completedAt: !item.completed ? new Date().toISOString() : undefined }
        : item
    );
    await supabase.from("surgeries").update({ checklist: newChecklist as any }).eq("id", surgeryId);
    setSurgeries(prev => prev.map(s => s.id === surgeryId ? { ...s, checklist: newChecklist } : s));
  }, [surgeries]);

  const addChecklistTemplate = useCallback(async (template: Omit<ChecklistTemplate, "id">) => {
    const { data: row, error } = await supabase.from("checklist_templates").insert({
      name: template.name, surgery_type: template.surgeryType, items: template.items as any,
    }).select().single();
    if (error) throw error;
    setChecklistTemplates(prev => [...prev, mapTemplate(row)]);
  }, []);

  const deleteChecklistTemplate = useCallback(async (id: string) => {
    await supabase.from("checklist_templates").delete().eq("id", id);
    setChecklistTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  const addAttachment = useCallback(async (patientId: string, attachment: Omit<Attachment, "id" | "uploadedAt">) => {
    const { data: row, error } = await supabase.from("patient_attachments").insert({
      patient_id: patientId, name: attachment.name, file_type: attachment.type,
      file_size: attachment.size, url: attachment.url,
    }).select().single();
    if (error) throw error;
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      return { ...p, attachments: [...p.attachments, { id: row.id, name: row.name, type: row.file_type ?? "", size: row.file_size ?? 0, url: row.url, uploadedAt: row.uploaded_at }] };
    }));
  }, []);

  const updatePrintSettings = useCallback(async (settings: Partial<PrintSettings>) => {
    if (!printSettings) return;
    const update: any = {};
    if (settings.logoUrl !== undefined) update.logo_url = settings.logoUrl;
    if (settings.headerTitle !== undefined) update.header_title = settings.headerTitle;
    if (settings.headerSubtitle !== undefined) update.header_subtitle = settings.headerSubtitle;
    if (settings.footerText !== undefined) update.footer_text = settings.footerText;
    if (settings.showLogo !== undefined) update.show_logo = settings.showLogo;
    if (settings.showHeader !== undefined) update.show_header = settings.showHeader;
    if (settings.showFooter !== undefined) update.show_footer = settings.showFooter;
    await supabase.from("print_settings").update(update).eq("id", printSettings.id);
    setPrintSettings(prev => prev ? { ...prev, ...settings } : prev);
  }, [printSettings]);

  const uploadLogo = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    return data.publicUrl;
  }, []);

  return (
    <AppContext.Provider value={{
      patients, surgeries, checklistTemplates, printSettings, loading,
      addPatient, updatePatient, deletePatient,
      addSurgery, updateSurgery, deleteSurgery,
      toggleChecklistItem, addChecklistTemplate, deleteChecklistTemplate,
      addAttachment, updatePrintSettings, uploadLogo, refreshData,
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
