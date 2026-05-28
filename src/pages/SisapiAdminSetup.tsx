import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, ShieldCheck, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

export default function SisapiAdminSetup() {
  const [roleName, setRoleName] = useState("");
  const [authorityName, setAuthorityName] = useState("");
  const [authorityPosition, setAuthorityPosition] = useState("");

  const { data: roles, refetch: refetchRoles } = useQuery({
    queryKey: ["sisapi-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sisapi_roles").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: authorities, refetch: refetchAuthorities } = useQuery({
    queryKey: ["sisapi-authorities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sisapi_authorities").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleAddRole = async () => {
    if (!roleName) return;
    const { error } = await supabase.from("sisapi_roles").insert([{ name: roleName }]);
    if (error) toast.error("Erro ao adicionar função");
    else {
      toast.success("Função adicionada");
      setRoleName("");
      refetchRoles();
    }
  };

  const handleAddAuthority = async () => {
    if (!authorityName || !authorityPosition) return;
    const { error } = await supabase.from("sisapi_authorities").insert([
      { name: authorityName, position: authorityPosition }
    ]);
    if (error) toast.error("Erro ao adicionar autoridade");
    else {
      toast.success("Autoridade adicionada");
      setAuthorityName("");
      setAuthorityPosition("");
      refetchAuthorities();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configurações SISAPI</h1>
        <p className="text-muted-foreground">Tabelas de apoio e autoridades para o sistema documental.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Funções / Cargos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome da Função"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
              <Button onClick={handleAddRole}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles?.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>{role.name}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-red-600">
                          <Trash className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Autoridades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Nome"
                value={authorityName}
                onChange={(e) => setAuthorityName(e.target.value)}
              />
              <Input
                placeholder="Cargo"
                value={authorityPosition}
                onChange={(e) => setAuthorityPosition(e.target.value)}
              />
            </div>
            <Button onClick={handleAddAuthority} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Autoridade
            </Button>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authorities?.map((auth) => (
                    <TableRow key={auth.id}>
                      <TableCell>{auth.name}</TableCell>
                      <TableCell>{auth.position}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-red-600">
                          <Trash className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
