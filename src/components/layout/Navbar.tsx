import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutGrid, LogOut, Users } from "lucide-react";

export const Navbar = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const isAdmin = user?.email === "admin@gmail.com";

  return (
    <header className="h-16 bg-primary flex items-center justify-between px-8 z-50 shadow-md mb-8">
      <div className="flex items-center gap-4">
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-bold text-white tracking-tight">
            SISAPI - Sistema de automação de processos internos
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isAdmin && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/usuarios")}
            className="text-white hover:bg-white/10 gap-2 font-medium"
          >
            <Users className="h-4 w-4" />
            Gestão de Usuários
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/modules")}
          className="text-white hover:bg-white/10 gap-2 font-medium"
        >
          <LayoutGrid className="h-4 w-4" />
          Módulos
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => signOut()} 
          className="text-white hover:bg-red-500/20 hover:text-red-100 gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </header>
  );
};
