import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ClipboardList, Trash2, X } from "lucide-react";
import { PrintSettingsDialog } from "@/components/PrintSettingsDialog";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ChecklistTemplates() {
  const { checklistTemplates, addChecklistTemplate, deleteChecklistTemplate } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [surgeryType, setSurgeryType] = useState("");
  const [items, setItems] = useState<string[]>([""]);

  const handleAddItem = () => setItems(prev => [...prev, ""]);
  const handleRemoveItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const handleItemChange = (idx: number, value: string) => setItems(prev => prev.map((item, i) => i === idx ? value : item));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(i => i.trim());
    if (!name.trim() || validItems.length === 0) return;
    await addChecklistTemplate({
      name, surgeryType,
      items: validItems.map(label => ({ id: crypto.randomUUID(), label })),
    });
    setName(""); setSurgeryType(""); setItems([""]); setOpen(false);
    toast.success("Modelo criado com sucesso!");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir este modelo?")) {
      await deleteChecklistTemplate(id);
      toast.success("Modelo excluído");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Modelos de Checklist</h1>
          <p className="text-muted-foreground mt-1">Crie e gerencie modelos reutilizáveis</p>
        </div>
        <div className="flex gap-2">
          <PrintSettingsDialog />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Novo Modelo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Criar Modelo de Checklist</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nome do modelo</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Cirurgia Cardíaca" required />
                </div>
                <div>
                  <Label>Tipo de cirurgia</Label>
                  <Input value={surgeryType} onChange={e => setSurgeryType(e.target.value)} placeholder="Ex: Herniorrafia, Colecistectomia" required />
                </div>
                <div>
                  <Label>Itens do checklist</Label>
                  <div className="space-y-2 mt-2">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input value={item} onChange={e => handleItemChange(i, e.target.value)} placeholder={`Item ${i + 1}`} />
                        {items.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(i)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                      <Plus className="w-3 h-3 mr-1" />Adicionar item
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit">Criar Modelo</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {checklistTemplates.map((template, i) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{template.name}</p>
                <p className="text-xs text-muted-foreground">
                  {template.surgeryType === "pequena" ? "Pequeno porte" : "Grande porte"} • {template.items.length} itens
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {template.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0" />
                  {item.label}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
        {checklistTemplates.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum modelo cadastrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
