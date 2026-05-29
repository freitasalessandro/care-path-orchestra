import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutGrid, LogOut, User, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppTopbar() {
  const { user, signOut, setSelectedModule } = useAuth();

  const { data: settings } = useQuery({
    queryKey: ["sisapi-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("sisapi_settings").select("*").limit(1).maybeSingle();
      return data;
    }
  });

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white flex items-center justify-between px-6 z-50 shadow-sm border-b border-slate-200">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <img src="/timbre-neopolis.png" alt="Prefeitura de Neópolis" className="h-10 w-auto object-contain" />
          <div className="w-px h-8 bg-slate-200" />
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-black text-slate-800 tracking-tighter">SISAPI</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Gestão Documental</span>
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setSelectedModule(null)}
          className="text-slate-600 hover:bg-slate-100 gap-2 font-medium border border-slate-200"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Módulos</span>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border border-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto p-2">
              <p className="text-xs text-center py-4 text-muted-foreground">Nenhuma notificação nova</p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
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
            <DropdownMenuItem onClick={() => setSelectedModule(null)} className="cursor-pointer">
              <LayoutGrid className="mr-2 h-4 w-4" />
              <span>Trocar Módulo</span>
            </DropdownMenuItem>
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

