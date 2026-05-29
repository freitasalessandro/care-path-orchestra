import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Scissors, ClipboardList, ChevronLeft, ChevronRight, Building, UserCircle, Briefcase, GraduationCap, Settings, FileBarChart, FileText, Clock, Library, ShieldCheck, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart },
  { to: "/configuracoes", label: "Dados da Secretaria", icon: Settings },
];

const ioseLinks = [
  { to: "/", label: "Painel Iose", icon: LayoutDashboard },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/lista", label: "Lista de Cirurgia", icon: Scissors },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart },
];

const sisapiLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { to: "/documentos", label: "Documentos", icon: FileText, id: "documents" },
  { to: "/pendentes", label: "Meus Pendentes", icon: Clock, id: "pending" },
  { to: "/acervo", label: "Acervo Digital", icon: Library, id: "archive" },
  { to: "/usuarios", label: "Gestão de Usuários", icon: Users, id: "users", adminOnly: true },
  { to: "/funcoes", label: "Funções e Cargos", icon: Key, id: "roles", adminOnly: true },
  { to: "/autoridades", label: "Autoridades", icon: ShieldCheck, id: "authorities", adminOnly: true },
  { to: "/identidade", label: "Identidade Visual", icon: Building, id: "branding", adminOnly: true },
  { to: "/configuracoes", label: "Configurações", icon: Settings, id: "settings", adminOnly: true },
];

const examLinks = [
  { to: "/", label: "Controle de Exames", icon: FileText },
];

export function AppSidebar() {
  const location = useLocation();
  const { collapsed, toggle } = useSidebarContext();
  const { selectedModule, user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["sisapi-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("sisapi_profiles")
        .select(`*, role:role_id(*)`)
        .eq("id", user.id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id && (selectedModule === "sisapi" || location.pathname === "/usuarios"),
  });
  
  const isUserManagement = location.pathname === "/usuarios";
  
  let links = isUserManagement ? sisapiLinks : selectedModule === "hr" ? hrLinks : selectedModule === "iose" ? ioseLinks : selectedModule === "sisapi" ? sisapiLinks : selectedModule === "exams" ? examLinks : surgeryLinks;

  // Filter links for SISAPI based on permissions and admin status
  if ((selectedModule === "sisapi" || isUserManagement) && profile) {
    links = sisapiLinks.filter(link => {
      // Admins see everything
      const isSpecialAdmin = profile.is_admin || user?.email === "admin@gmail.com";
      if (isSpecialAdmin) return true;

      
      // If it's admin only and user is not admin, hide it
      if (link.adminOnly) return false;

      // Check if user's role has permission for this link
      if (profile.role && Array.isArray(profile.role.permissions)) {
        return profile.role.permissions.includes(link.id);
      }

      // Default to visible if no specific permission required (unless it was adminOnly)
      return true;
    });
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border flex flex-col z-40 transition-all duration-200",
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
