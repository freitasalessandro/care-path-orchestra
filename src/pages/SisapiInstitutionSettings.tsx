import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Save, Upload, MapPin, Fingerprint } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SisapiPageHeader } from "@/components/sisapi/SisapiPageHeader";

export default function SisapiInstitutionSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [settings, setSettings] = useState({
    institution_name: "",
    institution_logo_url: "",
    address: "",
    city_state: "",
    cnpj: ""
  });

  const { data: profile } = useQuery({
    queryKey: ["sisapi-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("sisapi_profiles").select("*").eq("id", user?.id).single();
      return data;
    }
  });

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("sisapi_settings")
      .select("*")
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setSettings(data);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("sisapi_settings")
      .upsert([{
        ...settings,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      }]);

    if (error) {
      console.error("Erro ao salvar sisapi_settings:", error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } else {
      toast.success("Configurações salvas com sucesso");
    }
    setLoading(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `institution-logo-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setSettings(prev => ({ ...prev, institution_logo_url: publicUrl }));
      toast.success("Logo enviada com sucesso");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (profile && !profile.is_admin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SisapiPageHeader 
        title="Identidade Institucional"
        description="Configure os dados que aparecerão no cabeçalho de todos os documentos."
      >
        <Button onClick={handleSave} disabled={loading} className="bg-slate-800 hover:bg-slate-700">
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
      </SisapiPageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Informações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Instituição / Órgão</Label>
              <Input 
                value={settings.institution_name} 
                onChange={(e) => setSettings(prev => ({ ...prev, institution_name: e.target.value }))}
                placeholder="Ex: PREFEITURA MUNICIPAL DE NEÓPOLIS"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4" /> CNPJ
                </Label>
                <Input 
                  value={settings.cnpj} 
                  onChange={(e) => setSettings(prev => ({ ...prev, cnpj: e.target.value }))}
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Cidade - UF
                </Label>
                <Input 
                  value={settings.city_state} 
                  onChange={(e) => setSettings(prev => ({ ...prev, city_state: e.target.value }))}
                  placeholder="Neópolis - SE"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Endereço Completo</Label>
              <Input 
                value={settings.address} 
                onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua, Número, Bairro"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Brasão / Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="w-40 h-40 border-2 border-dashed rounded-lg flex items-center justify-center bg-slate-50 relative overflow-hidden">
              {settings.institution_logo_url ? (
                <img src={settings.institution_logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <Building2 className="w-12 h-12 text-slate-300" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              )}
            </div>
            <Label htmlFor="logo-upload" className="w-full">
              <div className="w-full cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-md text-center text-sm font-medium transition-colors">
                Alterar Imagem
              </div>
              <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
            </Label>
            <p className="text-[10px] text-muted-foreground text-center">
              Recomendado: PNG fundo transparente, proporção quadrada.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}