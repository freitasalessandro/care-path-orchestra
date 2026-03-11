import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Scissors, Trash2, X, Pencil, Printer, ChevronDown, ChevronRight, ClipboardList } from "lucide-react";
import { PrintSettingsDialog } from "@/components/PrintSettingsDialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { ChecklistTemplate } from "@/types";

export default function ChecklistTemplates() {
  const { checklistTemplates, addChecklistTemplate, updateChecklistTemplate, deleteChecklistTemplate, printSettings } = useApp();
  const [open, setOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
  const [name, setName] = useState("");
  const [surgeryType, setSurgeryType] = useState("");
  const [items, setItems] = useState<string[]>([""]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleAddItem = () => setItems(prev => [...prev, ""]);
  const handleRemoveItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const handleItemChange = (idx: number, value: string) => setItems(prev => prev.map((item, i) => i === idx ? value : item));

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const resetForm = () => {
    setName(""); setSurgeryType(""); setItems([""]); setEditingTemplate(null);
  };

  const openCreate = () => { resetForm(); setOpen(true); };

  const openEdit = (template: ChecklistTemplate) => {
    setEditingTemplate(template);
    setName(template.name);
    setSurgeryType(template.surgeryType);
    setItems(template.items.map(i => i.label));
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(i => i.trim());
    if (!name.trim() || validItems.length === 0) return;
    const payload = {
      name, surgeryType,
      items: validItems.map(label => ({ id: crypto.randomUUID(), label })),
    };
    if (editingTemplate) {
      await updateChecklistTemplate(editingTemplate.id, payload);
      toast.success("Cirurgia atualizada com sucesso!");
    } else {
      await addChecklistTemplate(payload);
      toast.success("Cirurgia cadastrada com sucesso!");
    }
    resetForm(); setOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir esta cirurgia e seu checklist?")) {
      await deleteChecklistTemplate(id);
      toast.success("Cirurgia excluída");
    }
  };

  const handlePrintTemplate = (template: ChecklistTemplate) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
      <head>
        <title>Checklist - ${template.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #1a1a1a; }
          .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #0d9488; padding-bottom: 20px; }
          .logo { max-height: 80px; margin-bottom: 12px; }
          .header h1 { font-size: 20px; font-weight: 700; color: #0d9488; }
          .header h2 { font-size: 14px; font-weight: 400; color: #666; margin-top: 4px; }
          .info { margin-bottom: 24px; padding: 16px; background: #f8fafa; border-radius: 8px; }
          .info p { font-size: 13px; color: #444; margin-bottom: 4px; }
          .info strong { color: #1a1a1a; }
          .checklist-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #0d9488; }
          .item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #eee; }
          .checkbox { width: 18px; height: 18px; border: 2px solid #ccc; border-radius: 3px; flex-shrink: 0; }
          .item-label { font-size: 13px; flex: 1; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
          .sig-line { border-top: 1px solid #333; padding-top: 8px; text-align: center; font-size: 12px; color: #666; }
          .patient-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .field-line { border-bottom: 1px solid #ccc; min-height: 24px; margin-top: 4px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        ${printSettings?.showHeader ? `
          <div class="header">
            ${printSettings?.showLogo && printSettings?.logoUrl ? `<img src="${printSettings.logoUrl}" alt="Logo" class="logo" />` : ""}
            <h1>${printSettings?.headerTitle || "Secretaria Municipal de Saúde"}</h1>
            ${printSettings?.headerSubtitle ? `<h2>${printSettings.headerSubtitle}</h2>` : ""}
          </div>
        ` : ""}
        <div class="info">
          <p><strong>Cirurgia:</strong> ${template.name}</p>
          <p><strong>Tipo:</strong> ${template.surgeryType}</p>
          <div class="patient-fields" style="margin-top: 12px;">
            <p><strong>Paciente:</strong> <span class="field-line" style="display:inline-block; width: 200px;"></span></p>
            <p><strong>Data:</strong> <span class="field-line" style="display:inline-block; width: 200px;"></span></p>
          </div>
        </div>
        <div class="checklist-title">Exames Solicitados</div>
        ${template.items.map(item => `
          <div class="item">
            <div class="checkbox"></div>
            <span class="item-label">${item.label}</span>
          </div>
        `).join("")}
        <div class="signatures">
          <div class="sig-line">Responsável Técnico</div>
          <div class="sig-line">Paciente / Responsável</div>
        </div>
        ${printSettings?.showFooter && printSettings?.footerText ? `<div class="footer">${printSettings.footerText}</div>` : ""}
      </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cadastro de Cirurgias</h1>
          <p className="text-muted-foreground mt-1">Cadastre cirurgias e defina os exames solicitados em cada uma</p>
        </div>
        <div className="flex gap-2">
          <PrintSettingsDialog />
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nova Cirurgia</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? "Editar Cirurgia" : "Cadastrar Cirurgia"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nome da cirurgia</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Herniorrafia" required />
                </div>
                <div>
                  <Label>Tipo / Categoria</Label>
                  <Input value={surgeryType} onChange={e => setSurgeryType(e.target.value)} placeholder="Ex: Geral, Cardíaca, Ortopédica" required />
                </div>
                <div>
                  <Label>Exames solicitados (checklist)</Label>
                  <div className="space-y-2 mt-2 max-h-[40vh] overflow-y-auto pr-1">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input value={item} onChange={e => handleItemChange(i, e.target.value)} placeholder={`Exame ${i + 1}`} />
                        {items.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(i)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                      <Plus className="w-3 h-3 mr-1" />Adicionar exame
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
                  <Button type="submit">{editingTemplate ? "Salvar" : "Cadastrar"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-3">
        {checklistTemplates.map((template, i) => {
          const isExpanded = expandedIds.has(template.id);
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card rounded-xl overflow-hidden"
            >
              <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(template.id)}>
                <div className="flex items-center gap-3 p-4">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-3 flex-1 text-left">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Scissors className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.surgeryType} • {template.items.length} exame(s)</p>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handlePrintTemplate(template)}>
                      <Printer className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(template)}>
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-0">
                    <div className="border-t border-border pt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <ClipboardList className="w-3.5 h-3.5" /> Exames Solicitados
                      </p>
                      {template.items.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Nenhum exame cadastrado</p>
                      ) : (
                        template.items.map((item, idx) => (
                          <div key={item.id} className="flex items-center gap-2 text-sm text-foreground py-1.5 px-3 rounded-lg bg-secondary/50">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 font-medium">
                              {idx + 1}
                            </span>
                            {item.label}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          );
        })}
        {checklistTemplates.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Scissors className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma cirurgia cadastrada</p>
            <p className="text-sm mt-1">Cadastre cirurgias e defina os exames necessários</p>
          </div>
        )}
      </div>
    </div>
  );
}
