import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Library, Upload, Search, File, MoreVertical, Download, Trash } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function SisapiArchive() {
  const [search, setSearch] = useState("");

  const { data: files, isLoading, refetch } = useQuery({
    queryKey: ["sisapi-archive", search],
    queryFn: async () => {
      let query = supabase
        .from("sisapi_archive_files")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("file_name", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleUpload = () => {
    toast.info("Funcionalidade de upload será integrada com o bucket de storage.");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Acervo Digital</h1>
          <p className="text-muted-foreground">Repositório de arquivos e documentos digitalizados.</p>
        </div>
        <Button onClick={handleUpload} className="bg-slate-800">
          <Upload className="w-4 h-4 mr-2" />
          Upload de Arquivo
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar no acervo..."
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
              <TableHead>Tipo</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Carregando acervo...
                </TableCell>
              </TableRow>
            ) : files?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Library className="w-12 h-12 text-slate-200" />
                    <span>O acervo está vazio.</span>
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
                  <TableCell>{file.file_type || "N/A"}</TableCell>
                  <TableCell>{file.size_bytes ? `${(file.size_bytes / 1024 / 1024).toFixed(2)} MB` : "N/A"}</TableCell>
                  <TableCell>{format(new Date(file.created_at), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600">
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
