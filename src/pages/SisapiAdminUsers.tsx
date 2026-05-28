import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Shield, User, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Label } from "@/components/ui/label";

export default function SisapiAdminUsers() {
  const [uploading, setUploading] = useState<string | null>(null);

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ["sisapi-admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sisapi_profiles")
        .select(`
          *,
          role:role_id(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("sisapi_profiles")
      .update({ status: "approved" })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao aprovar usuário");
    } else {
      toast.success("Usuário aprovado com sucesso");
      refetch();
    }
  };

  const toggleAdmin = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("sisapi_profiles")
      .update({ is_admin: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao alterar privilégios");
    } else {
      toast.success("Privilégios alterados com sucesso");
      refetch();
    }
  };

  const handleSignatureUpload = async (userId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    if (file.type !== "image/png") {
      toast.error("Por favor, envie uma imagem em formato PNG.");
      return;
    }

    setUploading(userId);
    try {
      const fileName = `signatures/${userId}-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('logos') // Using existing 'logos' bucket as it is public, or we could use sisapi_documents
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("sisapi_profiles")
        .update({ signature_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      toast.success("Assinatura atualizada com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error("Erro ao enviar assinatura: " + error.message);
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Gestão de Usuários</h1>
        <p className="text-muted-foreground">Controle de acessos e assinaturas digitais.</p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assinatura (PNG)</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
              </TableRow>
            ) : profiles?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Nenhum usuário encontrado.</TableCell>
              </TableRow>
            ) : (
              profiles?.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <div>
                        <div>{profile.full_name || "Sem nome"}</div>
                        <div className="text-xs text-muted-foreground">{profile.role?.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {profile.is_admin ? (
                      <Badge className="bg-slate-800">Sim</Badge>
                    ) : (
                      <Badge variant="outline">Não</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {profile.status === "approved" || profile.status === "active" ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-600">Ativo</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {profile.signature_url ? (
                        <div className="relative group">
                          <img src={profile.signature_url} alt="Assinatura" className="h-10 w-24 object-contain border rounded p-1 bg-slate-50" />
                          <Label htmlFor={`sig-${profile.id}`} className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center cursor-pointer rounded">
                            <Upload className="w-4 h-4 text-white" />
                          </Label>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`sig-${profile.id}`} className="flex items-center gap-1 text-xs text-blue-600 cursor-pointer hover:underline">
                            <Upload className="w-3 h-3" /> Anexar PNG
                          </Label>
                        </div>
                      )}
                      <input 
                        id={`sig-${profile.id}`} 
                        type="file" 
                        accept="image/png" 
                        className="hidden" 
                        onChange={(e) => handleSignatureUpload(profile.id, e)}
                        disabled={uploading === profile.id}
                      />
                      {uploading === profile.id && <span className="text-[10px] animate-pulse">Enviando...</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {(profile.status !== "approved" && profile.status !== "active") && (
                      <Button variant="ghost" size="sm" onClick={() => handleApprove(profile.id)}>
                        <UserCheck className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => toggleAdmin(profile.id, profile.is_admin)}>
                      <Shield className="w-4 h-4 mr-1" />
                      {profile.is_admin ? "Remover Admin" : "Tornar Admin"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
