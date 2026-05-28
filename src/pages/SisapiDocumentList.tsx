import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, Filter, Eye, FileDown } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToPdf } from "@/utils/sisapiPdfExport";
import { SisapiPageHeader } from "@/components/sisapi/SisapiPageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SisapiDocumentList() {
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExportPdf = async (doc: any) => {
    setExporting(doc.id);
    try {
      // Fetch profile info for signatures
      const { data: authorProfile } = await supabase
        .from("sisapi_profiles")
        .select("*, role:role_id(name)")
        .eq("id", doc.author_id)
        .single();
        
      // Fetch signer info if different from author
      let signerProfile = null;
      if (doc.signed_by_user_id) {
        const { data } = await supabase
          .from("sisapi_profiles")
          .select("*, role:role_id(name)")
          .eq("id", doc.signed_by_user_id)
          .single();
        signerProfile = data;
      }

      // Check if it was signed by a representative (delegate)
      // If assigned_to != signed_by_user_id, it's a delegation
      const isDelegated = doc.signed_by_user_id && doc.assigned_to !== doc.signed_by_user_id;
      
      let authorityProfile = null;
      if (isDelegated) {
        const { data } = await supabase
          .from("sisapi_profiles")
          .select("*, role:role_id(name)")
          .eq("id", doc.assigned_to)
          .single();
        authorityProfile = data;
      }
        
      const { data: attachments } = await supabase
        .from("sisapi_archive_files")
        .select("*")
        .eq("document_id", doc.id);

      await exportToPdf({
        title: doc.title,
        document_type: doc.document_type,
        department: doc.department,
        content: doc.content,
        items: doc.items as any[],
        budget_info: doc.budget_info,
        creditor_info: doc.creditor_info,
        author_name: authorProfile?.full_name,
        author_role: authorProfile?.role?.name,
        author_signature: authorProfile?.signature_url,
        signer_name: signerProfile?.full_name,
        signer_signature: signerProfile?.signature_url,
        authority_name: authorityProfile?.full_name,
        authority_role: authorityProfile?.role?.name,
        is_delegated: isDelegated,
        is_finalized: doc.status === 'completed',
        attachments: attachments || []
      });
      toast.success("PDF gerado com sucesso");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setExporting(null);
    }
  };

  const { data: documents, isLoading } = useQuery({
    queryKey: ["sisapi-documents", search],
    queryFn: async () => {
      let query = supabase
        .from("sisapi_documents")
        .select(`
          *,
          author:sisapi_profiles!sisapi_documents_author_id_fkey(full_name),
          template:sisapi_document_templates(title)
        `)
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("title", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft": return <Badge variant="secondary">Rascunho</Badge>;
      case "pending_approval": return <Badge variant="outline" className="text-amber-600 border-amber-600">Pendente</Badge>;
      case "approved": return <Badge variant="outline" className="text-emerald-600 border-emerald-600">Aprovado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <SisapiPageHeader 
        title="Documentos"
        description="Gerencie e visualize os documentos administrativos."
      >
        <Button asChild className="bg-slate-800 hover:bg-slate-700">
          <Link to="/documentos/novo">
            <Plus className="w-4 h-4 mr-2" />
            Novo Documento
          </Link>
        </Button>
      </SisapiPageHeader>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Carregando documentos...
                </TableCell>
              </TableRow>
            ) : documents?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum documento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              documents?.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {doc.title}
                    </div>
                  </TableCell>
                  <TableCell>{doc.template?.title || "Personalizado"}</TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell>
                    {format(new Date(doc.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle>{doc.title}</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-[60vh] mt-4 p-4 border rounded-md bg-slate-50">
                          <div 
                            className="prose prose-slate max-w-none break-words whitespace-normal"
                            dangerouslySetInnerHTML={{ __html: doc.content }} 
                          />
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="sm" onClick={() => handleExportPdf(doc)} disabled={exporting === doc.id}>
                      <FileDown className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/documentos/editar/${doc.id}`}>Editar</Link>
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
