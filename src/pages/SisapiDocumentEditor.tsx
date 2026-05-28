import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bold, Italic, List, ListOrdered, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, Save, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function SisapiDocumentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (id) {
      loadDocument();
    }
  }, [id]);

  const loadDocument = async () => {
    const { data, error } = await supabase
      .from("sisapi_documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Erro ao carregar documento");
      return;
    }

    setTitle(data.title);
    editor?.commands.setContent(data.content);
  };

  const handleSave = async () => {
    if (!title || !editor?.getHTML()) {
      toast.error("Título e conteúdo são obrigatórios");
      return;
    }

    setLoading(true);
    const docData = {
      title,
      content: editor.getHTML(),
      author_id: user?.id,
      status: "draft",
    };

    let error;
    if (id) {
      const { error: updateError } = await supabase
        .from("sisapi_documents")
        .update(docData)
        .eq("id", id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("sisapi_documents")
        .insert([docData]);
      error = insertError;
    }

    setLoading(false);
    if (error) {
      toast.error("Erro ao salvar documento");
    } else {
      toast.success("Documento salvo com sucesso");
      navigate("/documentos");
    }
  };

  if (!editor) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate("/documentos")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={handleSave} disabled={loading} className="bg-slate-800">
          <Save className="w-4 h-4 mr-2" />
          {id ? "Atualizar" : "Salvar"}
        </Button>
      </div>

      <div className="space-y-4 bg-white p-8 rounded-lg border shadow-sm">
        <Input
          placeholder="Título do Documento"
          className="text-2xl font-bold border-none px-0 focus-visible:ring-0"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="border rounded-md overflow-hidden">
          <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'bg-slate-200' : ''}
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'bg-slate-200' : ''}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive('underline') ? 'bg-slate-200' : ''}
            >
              <UnderlineIcon className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200' : ''}
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200' : ''}
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200' : ''}
            >
              <AlignRight className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'bg-slate-200' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'bg-slate-200' : ''}
            >
              <ListOrdered className="w-4 h-4" />
            </Button>
          </div>
          <EditorContent 
            editor={editor} 
            className="prose prose-slate max-w-none p-4 min-h-[500px] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
