import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Search, Pencil, Trash2, Save, X } from "lucide-react";
import { SisapiPageHeader } from "@/components/sisapi/SisapiPageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Bold, Italic, List, ListOrdered, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function SisapiDocumentTemplates() {
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  
  // Template Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [modulesConfig, setModulesConfig] = useState({
    items: false,
    budget: false,
    creditor: false
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Defina o conteúdo padrão do modelo...' }),
    ],
    content: '',
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ["sisapi-document-templates", search],
    queryFn: async () => {
      let query = supabase
        .from("sisapi_document_templates")
        .select("*")
        .order("title");

      if (search) {
        query = query.ilike("title", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (templateData: any) => {
      if (editingTemplate) {
        const { error } = await supabase
          .from("sisapi_document_templates")
          .update(templateData)
          .eq("id", editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sisapi_document_templates")
          .insert([{ ...templateData, created_by: user?.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sisapi-document-templates"] });
      toast.success(editingTemplate ? "Modelo atualizado" : "Modelo criado");
      closeDialog();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao salvar modelo");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sisapi_document_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sisapi-document-templates"] });
      toast.success("Modelo excluído");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao excluir modelo");
    }
  });

  const openDialog = (template?: any) => {
    if (template) {
      setEditingTemplate(template);
      setTitle(template.title);
      setCategory(template.category || "");
      setModulesConfig(template.modules_config || { items: false, budget: false, creditor: false });
      editor?.commands.setContent(template.content || "");
    } else {
      setEditingTemplate(null);
      setTitle("");
      setCategory("");
      setModulesConfig({ items: false, budget: false, creditor: false });
      editor?.commands.setContent("");
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleSave = () => {
    if (!title) {
      toast.error("Título é obrigatório");
      return;
    }
    saveMutation.mutate({
      title,
      category,
      content: editor?.getHTML() || "",
      modules_config: modulesConfig
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este modelo?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <SisapiPageHeader 
        title="Modelos de Documento"
        description="Gerencie os modelos pré-definidos para novos documentos."
      >
        <Button onClick={() => openDialog()} className="bg-slate-800 hover:bg-slate-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Modelo
        </Button>
      </SisapiPageHeader>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar modelos..."
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
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Módulos Ativos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Carregando modelos...
                </TableCell>
              </TableRow>
            ) : templates?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum modelo encontrado.
                </TableCell>
              </TableRow>
            ) : (
              templates?.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {template.title}
                    </div>
                  </TableCell>
                  <TableCell>{template.category || "Geral"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {template.modules_config?.items && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">Itens</span>}
                      {template.modules_config?.budget && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">Dotação</span>}
                      {template.modules_config?.creditor && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">Credor</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openDialog(template)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{editingTemplate ? "Editar Modelo" : "Novo Modelo"}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Modelo</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Ex: Ofício Padrão"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input 
                  id="category" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  placeholder="Ex: Administrativo"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Módulos Adicionais</Label>
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="items" 
                    checked={modulesConfig.items} 
                    onCheckedChange={(checked) => setModulesConfig(prev => ({ ...prev, items: !!checked }))}
                  />
                  <Label htmlFor="items" className="text-sm font-normal cursor-pointer">Tabela de Itens</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="budget" 
                    checked={modulesConfig.budget} 
                    onCheckedChange={(checked) => setModulesConfig(prev => ({ ...prev, budget: !!checked }))}
                  />
                  <Label htmlFor="budget" className="text-sm font-normal cursor-pointer">Dotação Orçamentária</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="creditor" 
                    checked={modulesConfig.creditor} 
                    onCheckedChange={(checked) => setModulesConfig(prev => ({ ...prev, creditor: !!checked }))}
                  />
                  <Label htmlFor="creditor" className="text-sm font-normal cursor-pointer">Dados do Credor</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Conteúdo Padrão</Label>
              <div className="border rounded-md overflow-hidden">
                <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border-b">
                  <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive('bold') ? 'bg-slate-200' : ''}>
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().toggleItalic().run()} className={editor?.isActive('italic') ? 'bg-slate-200' : ''}>
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={editor?.isActive('underline') ? 'bg-slate-200' : ''}>
                    <UnderlineIcon className="w-4 h-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().setTextAlign('left').run()} className={editor?.isActive({ textAlign: 'left' }) ? 'bg-slate-200' : ''}>
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().setTextAlign('center').run()} className={editor?.isActive({ textAlign: 'center' }) ? 'bg-slate-200' : ''}>
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().setTextAlign('right').run()} className={editor?.isActive({ textAlign: 'right' }) ? 'bg-slate-200' : ''}>
                    <AlignRight className="w-4 h-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={editor?.isActive('bulletList') ? 'bg-slate-200' : ''}>
                    <List className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={editor?.isActive('orderedList') ? 'bg-slate-200' : ''}>
                    <ListOrdered className="w-4 h-4" />
                  </Button>
                </div>
                <EditorContent editor={editor} className="prose prose-slate max-w-none p-4 min-h-[200px] focus:outline-none" />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-2">
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-slate-800 hover:bg-slate-700">
              <Save className="w-4 h-4 mr-2" />
              Salvar Modelo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}