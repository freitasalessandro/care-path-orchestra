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
    <header className="fixed top-0 left-0 right-0 h-14 bg-primary flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-4">
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-bold text-primary-foreground tracking-wide">SISAPI</span>
          <span className="text-[10px] text-primary-foreground/70 font-medium">Sistema de Apoio à Gestão</span>
        </div>
        <div className="w-px h-8 bg-primary-foreground/30" />
        <img src={settings?.institution_logo_url || "/timbre-neopolis.png"} alt="Logo" className="h-9 object-contain" />
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border border-primary" />
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
            <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
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

