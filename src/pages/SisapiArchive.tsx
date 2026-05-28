import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Library, Upload, Search, File, MoreVertical, Download, Trash, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export default function SisapiArchive() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [department, setDepartment] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: files, isLoading, refetch } = useQuery({
    queryKey: ["sisapi-archive", search],
    queryFn: async () => {
      let query = supabase
        .from("sisapi_archive_files")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`file_name.ilike.%${search}%,department.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !department) {
      toast.error("Selecione um arquivo e informe o setor.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `archive/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sisapi_documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('sisapi_documents')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from("sisapi_archive_files")
        .insert([{
          file_name: selectedFile.name,
          file_url: publicUrl,
          file_type: selectedFile.type,
          size_bytes: selectedFile.size,
          uploaded_by: user?.id,
          department: department
        }]);

      if (dbError) throw dbError;

      toast.success("Documento digitalizado e arquivado com sucesso!");
      setIsDialogOpen(false);
      setSelectedFile(null);
      setDepartment("");
      refetch();
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao realizar upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!confirm("Tem certeza que deseja excluir este arquivo?")) return;

    try {
      // Extract path from URL if possible, or just delete from DB
      const { error } = await supabase
        .from("sisapi_archive_files")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Arquivo excluído do acervo.");
      refetch();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Acervo Digital</h1>
          <p className="text-muted-foreground">Repositório de arquivos e documentos digitalizados por setor.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-800 hover:bg-slate-700">
              <Upload className="w-4 h-4 mr-2" />
              Digitalizar Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Incluir no Acervo Digital</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Arquivo (PDF ou Imagem)</Label>
                <Input type="file" onChange={handleFileChange} accept=".pdf,image/*" />
              </div>
              <div className="space-y-2">
                <Label>Setor / Departamento</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                    <SelectItem value="Jurídico">Jurídico</SelectItem>
                    <SelectItem value="Administrativo">Administrativo</SelectItem>
                    <SelectItem value="Compras">Compras</SelectItem>
                    <SelectItem value="Saúde">Saúde</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpload} disabled={uploading || !selectedFile || !department} className="bg-slate-800">
                {uploading ? "Enviando..." : "Salvar no Acervo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou setor..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Arquivo</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Carregando acervo...
                </TableCell>
              </TableRow>
            ) : files?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FolderOpen className="w-12 h-12 text-slate-200" />
                    <span>Nenhum documento encontrado no acervo.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              files?.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4 text-slate-400" />
                      {file.file_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">
                      {file.department || "Geral"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs uppercase">{file.file_type?.split('/')[1] || "N/A"}</TableCell>
                  <TableCell className="text-xs">{file.size_bytes ? `${(file.size_bytes / 1024 / 1024).toFixed(2)} MB` : "N/A"}</TableCell>
                  <TableCell className="text-xs">{format(new Date(file.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(file.id, file.file_url)}>
                      <Trash className="w-4 h-4" />
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
