import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutGrid, ClipboardList, Wallet, Package, LogOut } from "lucide-react";

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
    id: "finance",
    title: "Módulo Financeiro",
    description: "Faturamento, contas a pagar e controle de caixa.",
    icon: Wallet,
    color: "bg-green-500",
    active: false,
  },
  {
    id: "stock",
    title: "Controle de Estoque",
    description: "Materiais cirúrgicos, OPMEs e insumos hospitalares.",
    icon: Package,
    color: "bg-orange-500",
    active: false,
  },
];

export default function ModuleSelection() {
  const { setSelectedModule, signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleModuleSelect = (moduleId: string) => {
    setSelectedModule(moduleId);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Olá, {user?.email?.split('@')[0]}</h1>
            <p className="text-gray-600">Selecione o módulo que deseja acessar hoje</p>
          </div>
          <Button variant="ghost" onClick={() => signOut()} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Card 
              key={module.id} 
              className={`overflow-hidden border-2 transition-all duration-200 ${
                module.active 
                  ? "hover:border-primary cursor-pointer shadow-md" 
                  : "opacity-60 grayscale cursor-not-allowed"
              }`}
              onClick={() => module.active && handleModuleSelect(module.id)}
            >
              <CardHeader className={`${module.color} text-white pb-8`}>
                <div className="p-3 bg-white/20 rounded-lg w-fit mb-4">
                  <module.icon className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl">{module.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <CardDescription className="text-gray-600 mb-6">
                  {module.description}
                </CardDescription>
                <Button 
                  className="w-full" 
                  variant={module.active ? "default" : "secondary"}
                  disabled={!module.active}
                >
                  {module.active ? "Acessar Módulo" : "Em breve"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
