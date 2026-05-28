import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, FileText, Send, PenTool, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SisapiPendingActions() {
  const { user } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isTramitarOpen, setIsTramitarOpen] = useState(false);
  const [nextUser, setNextUser] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: authorities } = useQuery({
    queryKey: ["sisapi-my-delegations", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("sisapi_authorities")
        .select("autoridade_user_id")
        .eq("representante_user_id", user?.id)
        .eq("ativo", true);
      return data?.map(a => a.autoridade_user_id) || [];
    },
    enabled: !!user,
  });

  const { data: pendingDocs, isLoading, refetch } = useQuery({
    queryKey: ["sisapi-pending-docs", user?.id, authorities],
    queryFn: async () => {
      const assignedIds = [user?.id, ...(authorities || [])].filter(Boolean);
      
      const { data, error } = await supabase
        .from("sisapi_documents")
        .select(`
          *,
          author:sisapi_profiles!sisapi_documents_author_id_fkey(full_name, signature_url),
          assigned_to_profile:sisapi_profiles!sisapi_documents_assigned_to_fkey(full_name)
        `)
        .in("assigned_to", assignedIds)
        .eq("status", "pending_approval")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: users } = useQuery({
    queryKey: ["sisapi-all-users"],
    queryFn: async () => {
      const { data } = await supabase.from("sisapi_profiles").select("id, full_name").neq("id", user?.id);
      return data || [];
    }
  });

  const handleSign = async (doc: any) => {
    // Check if user has signature
    const { data: profile } = await supabase
      .from("sisapi_profiles")
      .select("signature_url, full_name")
      .eq("id", user?.id)
      .single();
    
    if (!profile?.signature_url) {
      toast.error("Você precisa configurar sua assinatura no painel administrativo primeiro.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("sisapi_documents")
        .update({ 
          is_signed: true,
          signed_by_user_id: user?.id
        })
        .eq("id", doc.id);

      if (error) throw error;
      toast.success("Documento assinado com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error("Erro ao assinar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTramitar = async () => {
    if (!nextUser) {
      toast.error("Selecione um usuário para tramitar.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("sisapi_documents")
        .update({ 
          assigned_to: nextUser,
          is_signed: false // Reset signature for next user
        })
        .eq("id", selectedDoc.id);

      if (error) throw error;

      await supabase.from("sisapi_notifications").insert([{
        user_id: nextUser,
        title: "Documento Tramitado",
        message: `O documento "${selectedDoc.title}" foi tramitado para você.`,
        link: `/pendentes`,
        read: false
      }]);

      toast.success("Documento tramitado com sucesso!");
      setIsTramitarOpen(false);
      setNextUser("");
      refetch();
    } catch (error: any) {
      toast.error("Erro ao tramitar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async (doc: any) => {
    if (!confirm("Deseja finalizar este processo?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("sisapi_documents")
        .update({ status: "approved" })
        .eq("id", doc.id);

      if (error) throw error;
      toast.success("Processo finalizado com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error("Erro ao finalizar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Meus Pendentes</h1>
        <p className="text-muted-foreground">Documentos que aguardam sua assinatura ou tramitação.</p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Documento</TableHead>
              <TableHead>Autor/Origem</TableHead>
              <TableHead>Destinatário</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status Assinatura</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
              </TableRow>
            ) : pendingDocs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                    <span>Nenhuma pendência encontrada.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pendingDocs?.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {doc.title}
                    </div>
                  </TableCell>
                  <TableCell>{doc.author?.full_name || "Desconhecido"}</TableCell>
                  <TableCell>
                    {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {doc.is_signed ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-600">Assinado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">Aguardando Assinatura</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedDoc(doc); setIsViewOpen(true); }}>
                      <Eye className="w-4 h-4 mr-1" /> Ver
                    </Button>
                    
                    {!doc.is_signed ? (
                      <Button variant="outline" size="sm" onClick={() => handleSign(doc)} disabled={loading} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                        <PenTool className="w-4 h-4 mr-1" /> Assinar
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => { setSelectedDoc(doc); setIsTramitarOpen(true); }} className="text-amber-600 border-amber-200 hover:bg-amber-50">
                          <Send className="w-4 h-4 mr-1" /> Tramitar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleFinalize(doc)} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                          <CheckCircle className="w-4 h-4 mr-1" /> Finalizar
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Visualizar Documento */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] mt-4 p-6 border rounded-md bg-white">
            <div 
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedDoc?.content }} 
            />
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tramitar Documento */}
      <Dialog open={isTramitarOpen} onOpenChange={setIsTramitarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tramitar Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label>Próximo Responsável</Label>
            <Select value={nextUser} onValueChange={setNextUser}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione para quem enviar..." />
              </SelectTrigger>
              <SelectContent>
                {users?.map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground italic">
              O documento será removido da sua lista e aparecerá como pendente para o destinatário.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTramitarOpen(false)}>Cancelar</Button>
            <Button onClick={handleTramitar} disabled={loading || !nextUser} className="bg-slate-800">
              {loading ? "Tramitando..." : "Confirmar Envio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
