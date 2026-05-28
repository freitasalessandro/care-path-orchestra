import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bold, Italic, List, ListOrdered, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, Save, ArrowLeft, Upload, FileIcon, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ItemsModule, BudgetModule, CreditorModule } from "@/components/sisapi/DocumentModules";
import { Separator } from "@/components/ui/separator";

export default function SisapiDocumentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Basic Info
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("");
  const [department, setDepartment] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [templateId, setTemplateId] = useState("");
  
  // Module Data
  const [items, setItems] = useState<any[]>([]);
  const [budgetInfo, setBudgetInfo] = useState({ action: "", expense_element: "", resource_source: "" });
  const [creditorInfo, setCreditorInfo] = useState({ name: "", document: "", address: "", bank_details: "" });
  const [attachments, setAttachments] = useState<any[]>([]);
  
  // Lists for selection
  const [templates, setTemplates] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // Template config
  const [activeModules, setActiveModules] = useState({ items: false, budget: false, creditor: false });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Comece a escrever seu documento...' }),
    ],
    content: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    // Fetch Templates
    const { data: templatesData } = await supabase.from("sisapi_document_templates").select("*");
    setTemplates(templatesData || []);

    // Fetch Users (excluding current user)
    const { data: usersData } = await supabase
      .from("sisapi_profiles")
      .select("id, full_name")
      .neq("id", user?.id);
    setUsers(usersData || []);
  };

  const loadDocument = async () => {
    const { data, error } = await supabase
      .from("sisapi_documents")
      .select("*, attachments:sisapi_archive_files(*)")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Erro ao carregar documento");
      return;
    }

    setTitle(data.title);
    setDocType(data.document_type || "");
    setDepartment(data.department || "");
    setAssignedTo(data.assigned_to || "");
    setTemplateId(data.template_id || "");
    setItems((data.items as any[]) || []);
    setBudgetInfo((data.budget_info as any) || { action: "", expense_element: "", resource_source: "" });
    setCreditorInfo((data.creditor_info as any) || { name: "", document: "", address: "", bank_details: "" });
    setAttachments(data.attachments || []);
    editor?.commands.setContent(data.content);
    
    // Load template config if exists
    if (data.template_id) {
      const template = templates.find(t => t.id === data.template_id);
      if (template) {
        setActiveModules(template.modules_config || { items: false, budget: false, creditor: false });
      }
    }
  };

  const handleTemplateChange = (value: string) => {
    setTemplateId(value);
    const template = templates.find(t => t.id === value);
    if (template) {
      setActiveModules(template.modules_config || { items: false, budget: false, creditor: false });
      if (template.content && !editor?.getHTML() || editor?.getHTML() === '<p></p>') {
        editor?.commands.setContent(template.content);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sisapi_documents')
        .upload(filePath, file);

      if (uploadError) {
        toast.error(`Erro ao enviar arquivo: ${file.name}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('sisapi_documents')
        .getPublicUrl(filePath);

      const newAttachment = {
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        size_bytes: file.size,
        uploaded_by: user?.id,
      };

      setAttachments(prev => [...prev, newAttachment]);
    }
    setLoading(false);
    toast.success("Arquivos enviados com sucesso");
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title || !assignedTo) {
      toast.error("Título e destinatário são obrigatórios");
      return;
    }

    setLoading(true);
    const docData = {
      title,
      document_type: docType,
      department,
      content: editor?.getHTML() || "",
      author_id: user?.id,
      assigned_to: assignedTo,
      template_id: templateId || null,
      items,
      budget_info: budgetInfo,
      creditor_info: creditorInfo,
      status: "pending_approval",
    };

    let result;
    if (id) {
      result = await supabase
        .from("sisapi_documents")
        .update(docData)
        .eq("id", id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("sisapi_documents")
        .insert([docData])
        .select()
        .single();
    }

    if (result.error) {
      toast.error("Erro ao salvar documento");
      setLoading(false);
      return;
    }

    const documentId = result.data.id;

    // Handle attachments linking (new ones won't have document_id yet)
    if (attachments.length > 0) {
      const attachmentsToInsert = attachments
        .filter(a => !a.id)
        .map(a => ({ ...a, document_id: documentId }));
      
      if (attachmentsToInsert.length > 0) {
        await supabase.from("sisapi_archive_files").insert(attachmentsToInsert);
      }
    }

    // Generate Notification
    await supabase.from("sisapi_notifications").insert([{
      user_id: assignedTo,
      title: "Novo Documento Recebido",
      message: `Você recebeu o documento "${title}" para análise.`,
      link: `/documentos/editar/${documentId}`,
      read: false
    }]);

    setLoading(false);
    toast.success("Documento criado e encaminhado com sucesso");
    navigate("/documentos");
  };

  if (!editor) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/documentos")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h2 className="text-xl font-semibold text-slate-800">
            {id ? "Editar Documento" : "Novo Documento"}
          </h2>
        </div>
        <Button onClick={handleSave} disabled={loading} className="bg-slate-800 hover:bg-slate-700">
          <Save className="w-4 h-4 mr-2" />
          {id ? "Atualizar e Enviar" : "Criar e Enviar"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Header Section */}
          <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Modelo de Documento</Label>
                <Select value={templateId} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um modelo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Título do Documento</Label>
                <Input 
                  placeholder="Ex: Ofício 001/2026" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ofício">Ofício</SelectItem>
                    <SelectItem value="Memorando">Memorando</SelectItem>
                    <SelectItem value="Decreto">Decreto</SelectItem>
                    <SelectItem value="Portaria">Portaria</SelectItem>
                    <SelectItem value="Processo">Processo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Setor de Compras" />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-red-500">Direcionar para (Obrigatório)</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o destinatário..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Editor Section */}
          <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
            <Label className="text-lg font-semibold">Corpo do Documento</Label>
            <div className="border rounded-md overflow-hidden">
              <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border-b">
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-slate-200' : ''}>
                  <Bold className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-slate-200' : ''}>
                  <Italic className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'bg-slate-200' : ''}>
                  <UnderlineIcon className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200' : ''}>
                  <AlignLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200' : ''}>
                  <AlignCenter className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200' : ''}>
                  <AlignRight className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-slate-200' : ''}>
                  <List className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-slate-200' : ''}>
                  <ListOrdered className="w-4 h-4" />
                </Button>
              </div>
              <EditorContent editor={editor} className="prose prose-slate max-w-none p-6 min-h-[400px] focus:outline-none" />
            </div>
          </div>

          {/* Dynamic Modules */}
          {activeModules.items && (
            <ItemsModule items={items} onChange={setItems} />
          )}

          {activeModules.budget && (
            <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
              <Label className="text-lg font-semibold">Dotação Orçamentária</Label>
              <BudgetModule data={budgetInfo} onChange={setBudgetInfo} />
            </div>
          )}

          {activeModules.creditor && (
            <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
              <Label className="text-lg font-semibold">Dados do Credor</Label>
              <CreditorModule data={creditorInfo} onChange={setCreditorInfo} />
            </div>
          )}
        </div>

        {/* Sidebar Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Anexos</Label>
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex items-center text-sm text-blue-600 hover:text-blue-700">
                  <Upload className="w-4 h-4 mr-1" /> Adicionar
                </div>
                <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} />
              </Label>
            </div>
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-slate-50 text-sm">
                  <div className="flex items-center truncate gap-2">
                    <FileIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{file.file_name}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => removeAttachment(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {attachments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum anexo</p>
              )}
            </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-2">Instruções de Fluxo</h3>
            <p className="text-sm text-slate-600">
              Ao criar o documento, ele será salvo e uma notificação será enviada ao destinatário escolhido. 
              O documento aparecerá na lista de "Pendentes" dele para a próxima ação.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
