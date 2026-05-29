import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Search, Pencil, Trash2, Save, X, Image as ImageIcon, Upload } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Template Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [headerData, setHeaderData] = useState({
    brasao_url: "",
    estado: "ESTADO DE SERGIPE",
    orgao: "",
    endereco: "",
    cidade_uf: "",
    cnpj: "",
    titulo_documento: ""
  });
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
      setHeaderData(template.header_data || {
        brasao_url: "",
        estado: "ESTADO DE SERGIPE",
        orgao: "",
        endereco: "",
        cidade_uf: "",
        cnpj: "",
        titulo_documento: ""
      });
      setModulesConfig(template.modules_config || { items: false, budget: false, creditor: false });
      editor?.commands.setContent(template.content || "");
    } else {
      setEditingTemplate(null);
      setTitle("");
      setCategory("");
      setHeaderData({
        brasao_url: "",
        estado: "ESTADO DE SERGIPE",
        orgao: "PREFEITURA MUNICIPAL DE NEÓPOLIS",
        endereco: "",
        cidade_uf: "Neópolis - SE",
        cnpj: "",
        titulo_documento: ""
      });
      setModulesConfig({ items: false, budget: false, creditor: false });
      editor?.commands.setContent("");
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `brasoes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Erro ao enviar imagem");
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);

    setHeaderData(prev => ({ ...prev, brasao_url: publicUrl }));
    setIsUploading(false);
    toast.success("Brasão atualizado");
  };

  const handleSave = () => {
    if (!title) {
      toast.error("Título do modelo é obrigatório");
      return;
    }
    saveMutation.mutate({
      title,
      category,
      content: editor?.getHTML() || "",
      header_data: headerData,
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
        description="Gerencie os modelos e cabeçalhos pré-definidos para seus documentos."
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
            <TableRow className="bg-slate-50">
              <TableHead className="w-[30%]">Nome</TableHead>
              <TableHead className="w-[40%]">Órgão / Entidade</TableHead>
              <TableHead className="text-center">Itens</TableHead>
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
                  <TableCell>{(template.header_data as any)?.orgao || template.category || "Não definido"}</TableCell>
                  <TableCell className="text-center">
                    {(template.modules_config as any)?.items ? (
                      <span className="text-green-600 font-medium">Sim</span>
                    ) : (
                      <span className="text-slate-400">Não</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openDialog(template)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{editingTemplate ? "Editar Modelo" : "Novo Modelo"}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-semibold">Nome do Modelo *</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Ex: Modelo Padrão"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-6">
              <Label className="text-lg font-bold">Cabeçalho do Documento</Label>
              
              {/* Header Preview */}
              <div className="border border-dashed p-6 rounded-lg bg-slate-50 flex items-center justify-between text-center min-h-[120px]">
                <div className="w-20 h-20 border rounded flex items-center justify-center bg-white overflow-hidden shrink-0">
                  {headerData.brasao_url ? (
                    <img src={headerData.brasao_url} alt="Brasão" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 px-4 text-xs font-semibold space-y-0.5">
                  <p>{headerData.estado}</p>
                  <p className="text-sm font-bold uppercase">{headerData.orgao || "ENTIDADE NÃO DEFINIDA"}</p>
                  <p className="font-normal text-[10px] text-slate-500">{headerData.endereco}</p>
                  <p className="font-normal text-[10px] text-slate-500">{headerData.cidade_uf}</p>
                  <p className="font-normal text-[10px] text-slate-500">C.N.P.J.: {headerData.cnpj}</p>
                </div>
                <div className="w-40 text-right text-[10px] font-bold shrink-0 border-l pl-4">
                  {headerData.titulo_documento || "TÍTULO DO DOCUMENTO"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brasão / Logo</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-muted-foreground"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? "Enviando..." : "Escolher arquivo"}
                    </Button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input 
                    value={headerData.estado} 
                    onChange={(e) => setHeaderData(prev => ({ ...prev, estado: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Órgão / Entidade</Label>
                <Input 
                  value={headerData.orgao} 
                  onChange={(e) => setHeaderData(prev => ({ ...prev, orgao: e.target.value }))}
                  placeholder="Ex: PREFEITURA MUNICIPAL DE NEÓPOLIS"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input 
                    value={headerData.endereco} 
                    onChange={(e) => setHeaderData(prev => ({ ...prev, endereco: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade / UF</Label>
                  <Input 
                    value={headerData.cidade_uf} 
                    onChange={(e) => setHeaderData(prev => ({ ...prev, cidade_uf: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input 
                    value={headerData.cnpj} 
                    onChange={(e) => setHeaderData(prev => ({ ...prev, cnpj: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Título do Documento</Label>
                  <Input 
                    value={headerData.titulo_documento} 
                    onChange={(e) => setHeaderData(prev => ({ ...prev, titulo_documento: e.target.value }))}
                    placeholder="Ex: Solicitação / Reserva de Dotação"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-lg font-bold">Corpo do Documento</Label>
              <p className="text-xs text-slate-500">Texto padrão do modelo (ex: ofício, solicitação). O usuário poderá editar ao criar o documento.</p>
              <div className="border rounded-md overflow-hidden shadow-inner">
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
                <EditorContent editor={editor} className="prose prose-slate max-w-none p-4 min-h-[300px] focus:outline-none" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Lista de Produtos/Serviços</Label>
                  <p className="text-xs text-slate-500">Ativar tabela de itens neste modelo</p>
                </div>
                <Switch 
                  checked={modulesConfig.items} 
                  onCheckedChange={(checked) => setModulesConfig(prev => ({ ...prev, items: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Dotação Orçamentária</Label>
                  <p className="text-xs text-slate-500">Ativar campos de dotação orçamentária (Ação, Elemento de despesa, Fonte de Recurso)</p>
                </div>
                <Switch 
                  checked={modulesConfig.budget} 
                  onCheckedChange={(checked) => setModulesConfig(prev => ({ ...prev, budget: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Credor</Label>
                  <p className="text-xs text-slate-500">Ativar campos de credor (Nome, CNPJ/CPF, Endereço, Dados Bancários)</p>
                </div>
                <Switch 
                  checked={modulesConfig.creditor} 
                  onCheckedChange={(checked) => setModulesConfig(prev => ({ ...prev, creditor: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 border-t bg-slate-50">
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-slate-800 hover:bg-slate-700 min-w-[120px]">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}