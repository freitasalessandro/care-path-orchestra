import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Users, LogOut, Scissors, FileText, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";


const modules = [
  {
import { AppTopbar } from "@/components/AppTopbar";

// ... keep existing code
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppTopbar />

      <div className="max-w-5xl mx-auto px-8 pb-12 mt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Olá, {user?.email?.split('@')[0]}</h1>
          <p className="text-gray-600">Selecione o módulo que deseja acessar hoje</p>
        </div>
// ... keep existing code


      <div className="max-w-5xl mx-auto px-8 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Olá, {user?.email?.split('@')[0]}</h1>
          <p className="text-gray-600">Selecione o módulo que deseja acessar hoje</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => (
            <Card 
              key={module.id} 
              className="overflow-hidden border-2 transition-all duration-200 hover:border-primary cursor-pointer shadow-md"
              onClick={() => handleModuleSelect(module.id)}
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
