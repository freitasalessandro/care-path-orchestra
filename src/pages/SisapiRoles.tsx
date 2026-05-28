import { RoleManagement } from "@/components/sisapi/RoleManagement";

export default function SisapiRoles() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Funções e Permissões</h1>
        <p className="text-muted-foreground">Defina cargos e gerencie o acesso de cada função às telas do sistema.</p>
      </div>
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <RoleManagement />
      </div>
    </div>
  );
}