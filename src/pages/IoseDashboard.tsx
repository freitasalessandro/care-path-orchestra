import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Scissors, FileText, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

export default function IoseDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["iose-stats"],
    queryFn: async () => {
      const { count: patientsCount } = await supabase
        .from("iose_patients")
        .select("*", { count: "exact", head: true });
      
      const { count: surgeriesCount } = await supabase
        .from("iose_surgery_list")
        .select("*", { count: "exact", head: true });

      return {
        patients: patientsCount || 0,
        surgeries: surgeriesCount || 0,
      };
    },
  });

  const menuItems = [
    {
      title: "Pacientes",
      description: "Cadastro completo de pacientes",
      icon: Users,
      link: "/pacientes",
      color: "bg-blue-500",
    },
    {
      title: "Lista de Cirurgia",
      description: "Montagem e controle da lista Iose",
      icon: Scissors,
      link: "/lista",
      color: "bg-emerald-500",
    },
    {
      title: "Agendamentos",
      description: "Visualizar calendário de cirurgias",
      icon: Calendar,
      link: "/agendamentos",
      color: "bg-purple-500",
    },
    {
      title: "Relatórios",
      description: "Estatísticas e listagens",
      icon: FileText,
      link: "/relatorios",
      color: "bg-amber-500",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Módulo Iose</h1>
        <p className="text-gray-600">Gestão da lista de cirurgias oftalmológicas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.patients || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cirurgias Registradas</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.surgeries || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item) => (
          <Link key={item.link} to={item.link}>
            <Card className="hover:border-primary cursor-pointer transition-all duration-200 h-full">
              <CardHeader>
                <div className={`p-3 rounded-lg w-fit mb-2 ${item.color} text-white`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
