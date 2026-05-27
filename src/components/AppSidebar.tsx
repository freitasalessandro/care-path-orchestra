import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Scissors, ClipboardList, ChevronLeft, ChevronRight, Building, UserCircle, Briefcase, GraduationCap, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";

const surgeryLinks = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/cirurgias", label: "Cirurgias", icon: Scissors },
  { to: "/checklists", label: "Cadastro de Cirurgias", icon: ClipboardList },
];

const hrLinks = [
  { to: "/", label: "Painel RH", icon: LayoutDashboard },
  { to: "/funcionarios", label: "Funcionários", icon: UserCircle },
  { to: "/funcoes", label: "Funções", icon: GraduationCap },
  { to: "/unidades", label: "UBS / Unidades", icon: Building },
  { to: "/setores", label: "Setores", icon: Briefcase },
  { to: "/configuracoes", label: "Dados da Secretaria", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { collapsed, toggle } = useSidebarContext();
  const { selectedModule } = useAuth();
  
  const links = selectedModule === "hr" ? hrLinks : surgeryLinks;

  return (
    <aside
      className={cn(
        "fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-card border-r border-border flex flex-col z-40 transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center justify-end p-2">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggle}
                className="flex items-center justify-center p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Expandir menu" : "Recolher menu"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {links.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
