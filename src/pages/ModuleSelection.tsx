import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Users, Scissors, FileText, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppTopbar } from "@/components/AppTopbar";

const modules = [
  {
    id: "surgeries",
    title: "Gestão de Cirurgias",
    description: "Controle de pacientes, agendamentos e checklists cirúrgicos.",
    icon: ClipboardList,
    color: "bg-blue-500",
    active: true,
  },
  {
    id: "hr",
    title: "Recursos Humanos",
    description: "Cadastro de funcionários, UBS, setores e gestão de pessoal.",
    icon: Users,
    color: "bg-purple-500",
    active: true,
  },
  {
    id: "iose",
    title: "Lista Iose",
    description: "Cadastro de pacientes oftalmológicos e montagem de listas de cirurgia.",
    icon: Scissors,
    color: "bg-emerald-500",
    active: true,
  },
  {
    id: "sisapi",
    title: "SISAPI - Gestão Documental",
    description: "Sistema de apoio à gestão com controle de documentos, fluxos e acervo digital.",
    icon: FileText,
    color: "bg-slate-800",
    active: true,
  },
  {
    id: "exams",
    title: "Resultados de Exames",
    description: "Controle de chegada e entrega de resultados de exames para pacientes.",
    icon: FileText,
    color: "bg-rose-500",
    active: true,
  },
];

export default function ModuleSelection() {
  const { setSelectedModule, user } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-modules", user?.id],
    queryFn: async () => {
      if (localStorage.getItem("sb-dummy-session") === "true") {
        return { 
          is_admin: true, 
          allowed_modules: ['sisapi', 'surgeries', 'hr', 'iose', 'exams'],
          full_name: 'Administrador Mestre'
        };
      }

      const { data, error } = await supabase
        .from("sisapi_profiles")
        .select("allowed_modules, is_admin")
        .eq("id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (!data && user?.id) {
        try {
          const { data: newProfile, error: createError } = await supabase
            .from("sisapi_profiles")
            .upsert({
              id: user.id,
              full_name: user.email?.split('@')[0] || 'Administrador',
              is_admin: true,
              allowed_modules: ['sisapi', 'surgeries', 'hr', 'iose', 'exams'],
              status: 'active'
            })
            .select("allowed_modules, is_admin")
            .single();

          if (createError) throw createError;
          return newProfile;
        } catch (e) {
          console.error("Error creating initial profile:", e);
          return { is_admin: true, allowed_modules: ['sisapi', 'surgeries', 'hr', 'iose', 'exams'] };
        }
      }

      return data;
    },
    enabled: !!user?.id,
  });

  const handleModuleSelect = (moduleId: string) => {
    setSelectedModule(moduleId);
    if (moduleId === "exams") {
      navigate("/exams-control");
    } else if (moduleId === "sisapi") {
      navigate("/sisapi");
    } else if (moduleId === "hr") {
      navigate("/hr-dashboard");
    } else if (moduleId === "iose") {
      navigate("/iose-dashboard");
    } else if (moduleId === "surgeries") {
      navigate("/");
    } else {
      navigate("/");
    }
  };

  const filteredModules = modules.filter(module => {
    const isSpecialAdmin = profile?.is_admin || user?.email === "admin@gmail.com";
    const hasAccess = isSpecialAdmin || (profile?.allowed_modules && Array.isArray(profile.allowed_modules) && profile.allowed_modules.includes(module.id));
    return !!hasAccess;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
      <AppTopbar />

      <div className="max-w-5xl mx-auto px-8 pb-12 mt-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Olá, {user?.email?.split('@')[0]}</h1>
          <p className="text-gray-600">Selecione o módulo que deseja acessar hoje</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => (
            <Card 
              key={module.id} 
              className="flex flex-col h-full overflow-hidden border-2 transition-all duration-200 hover:border-primary cursor-pointer shadow-md"
              onClick={() => handleModuleSelect(module.id)}
            >
              <CardHeader className={`${module.color} text-white pb-8`}>
                <div className="p-3 bg-white/20 rounded-lg w-fit mb-4">
                  <module.icon className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl line-clamp-1">{module.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col flex-1">
                <CardDescription className="text-gray-600 mb-6 flex-1 line-clamp-3">
                  {module.description}
                </CardDescription>
                <Button 
                  className="w-full mt-auto" 
                  variant="default"
                >
                  Acessar Módulo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
