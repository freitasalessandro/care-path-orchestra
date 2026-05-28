import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserX, Shield, User } from "lucide-react";
import { toast } from "sonner";

export default function SisapiAdminUsers() {
  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ["sisapi-admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sisapi_profiles")
        .select(`
          *,
          role:role_id(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("sisapi_profiles")
      .update({ status: "approved" })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao aprovar usuário");
    } else {
      toast.success("Usuário aprovado com sucesso");
      refetch();
    }
  };

  const toggleAdmin = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("sisapi_profiles")
      .update({ is_admin: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao alterar privilégios");
    } else {
      toast.success("Privilégios alterados com sucesso");
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Gestão de Usuários</h1>
        <p className="text-muted-foreground">Aprovação de cadastros e controle de acessos.</p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
              </TableRow>
            ) : profiles?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Nenhum usuário encontrado.</TableCell>
              </TableRow>
            ) : (
              profiles?.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      {profile.full_name || "Sem nome"}
                    </div>
                  </TableCell>
                  <TableCell>{profile.role?.name || "Sem função"}</TableCell>
                  <TableCell>
                    {profile.is_admin ? (
                      <Badge className="bg-slate-800">Sim</Badge>
                    ) : (
                      <Badge variant="outline">Não</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {profile.status === "approved" ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-600">Aprovado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {profile.status !== "approved" && (
                      <Button variant="ghost" size="sm" onClick={() => handleApprove(profile.id)}>
                        <UserCheck className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => toggleAdmin(profile.id, profile.is_admin)}>
                      <Shield className="w-4 h-4 mr-1" />
                      {profile.is_admin ? "Remover Admin" : "Tornar Admin"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
