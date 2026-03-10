import { useState, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Upload, Image } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export function PrintSettingsDialog() {
  const { printSettings, updatePrintSettings, uploadLogo } = useApp();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!printSettings) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadLogo(file);
      await updatePrintSettings({ logoUrl: url });
      toast.success("Logo atualizada com sucesso!");
    } catch {
      toast.error("Erro ao enviar logo");
    }
    setUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />Configurar Impressão
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações de Impressão</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo da Secretaria</Label>
            <div className="flex items-center gap-3">
              {printSettings.logoUrl ? (
                <img src={printSettings.logoUrl} alt="Logo" className="h-12 object-contain rounded border border-border p-1" />
              ) : (
                <div className="h-12 w-12 rounded border border-dashed border-border flex items-center justify-center">
                  <Image className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload className="w-3 h-3 mr-1" />{uploading ? "Enviando..." : "Enviar Logo"}
              </Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <Label>Título do Cabeçalho</Label>
            <Input
              value={printSettings.headerTitle}
              onChange={e => updatePrintSettings({ headerTitle: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Subtítulo</Label>
            <Input
              value={printSettings.headerSubtitle ?? ""}
              onChange={e => updatePrintSettings({ headerSubtitle: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Texto do Rodapé</Label>
            <Input
              value={printSettings.footerText ?? ""}
              onChange={e => updatePrintSettings({ footerText: e.target.value })}
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Exibir Logo</Label>
              <Switch checked={printSettings.showLogo} onCheckedChange={v => updatePrintSettings({ showLogo: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Exibir Cabeçalho</Label>
              <Switch checked={printSettings.showHeader} onCheckedChange={v => updatePrintSettings({ showHeader: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Exibir Rodapé</Label>
              <Switch checked={printSettings.showFooter} onCheckedChange={v => updatePrintSettings({ showFooter: v })} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
