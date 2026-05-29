import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutGrid, LogOut, User, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppTopbar() {
  const { user, signOut, setSelectedModule, profile } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.email === "admin@gmail.com" || profile?.is_admin;

  const handleModuleClick = () => {
    setSelectedModule(null);
    navigate("/modules");
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-primary flex items-center justify-between px-8 z-50 shadow-md shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-lg md:text-xl font-bold text-white tracking-tight truncate max-w-[200px] md:max-w-none">
            SISAPI <span className="hidden sm:inline">- Sistema de automação de processos internos</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">


        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleModuleClick}
          className="text-white hover:bg-white/10 gap-2 font-medium"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Módulos</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Minha Conta</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleModuleClick} className="cursor-pointer">
              <LayoutGrid className="mr-2 h-4 w-4" />
              <span>Trocar Módulo</span>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => navigate("/usuarios")} className="cursor-pointer md:hidden">
                <Users className="mr-2 h-4 w-4" />
                <span>Gestão de Usuários</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
