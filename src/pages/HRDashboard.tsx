import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, Building, GraduationCap, Settings, FileBarChart } from "lucide-react";
import { Link } from "react-router-dom";

export default function HRDashboard() {
  const menuItems = [
    { 
      title: "Funcionários", 
      description: "Gestão completa do quadro de pessoal",
      icon: UserCircle, 
      path: "/funcionarios",
      color: "bg-blue-500",
      textColor: "text-blue-600"
    },
    { 
      title: "UBS / Unidades", 
      description: "Cadastro de unidades e setores",
      icon: Building, 
      path: "/unidades",
      color: "bg-green-500",
      textColor: "text-green-600"
    },
    { 
      title: "Funções", 
      description: "Cargos e cargas horárias",
      icon: GraduationCap, 
      path: "/funcoes",
      color: "bg-purple-500",
      textColor: "text-purple-600"
    },
    { 
      title: "Relatórios", 
      description: "Quantitativos e estatísticas",
      icon: FileBarChart, 
      path: "/relatorios",
      color: "bg-orange-500",
      textColor: "text-orange-600"
    },
    { 
      title: "Configurações", 
      description: "Dados da Secretaria de Saúde",
      icon: Settings, 
      path: "/configuracoes",
      color: "bg-gray-500",
      textColor: "text-gray-600"
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Módulo de Recursos Humanos</h1>
        <p className="text-gray-600">Selecione uma das funções principais para começar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 h-full" style={{ borderLeftColor: `var(--${item.textColor.split('-')[1]}-500)` }}>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-xl ${item.color} bg-opacity-10`}>
                  <item.icon className={`w-6 h-6 ${item.textColor}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
