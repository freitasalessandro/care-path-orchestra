import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SisapiAuthority {
  id: string;
  autoridade_user_id: string;
  representante_user_id: string;
  tipo: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  autoridade?: {
    full_name: string;
    signature_url?: string;
  };
  representante?: {
    full_name: string;
    signature_url?: string;
  };
}

export function useSisapiAuthorities() {
  const queryClient = useQueryClient();

  const { data: authorities, isLoading } = useQuery({
    queryKey: ["sisapi-authorities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sisapi_authorities")
        .select(`
          *,
          autoridade:sisapi_profiles!sisapi_authorities_autoridade_user_id_fkey(full_name, signature_url),
          representante:sisapi_profiles!sisapi_authorities_representante_user_id_fkey(full_name, signature_url)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar autoridades");
        throw error;
      }
      return data as any[] as SisapiAuthority[];
    },
  });

  const createAuthority = useMutation({
    mutationFn: async (newAuth: { autoridade_user_id: string; representante_user_id: string; tipo: string; ativo?: boolean }) => {
      const { data, error } = await supabase
        .from("sisapi_authorities")
        .insert([newAuth])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sisapi-authorities"] });
      toast.success("Autoridade cadastrada com sucesso");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao cadastrar autoridade");
    },
  });

  const updateAuthority = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; autoridade_user_id?: string; representante_user_id?: string; tipo?: string; ativo?: boolean }) => {
      const { data, error } = await supabase
        .from("sisapi_authorities")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sisapi-authorities"] });
      toast.success("Autoridade atualizada com sucesso");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao atualizar autoridade");
    },
  });

  const deleteAuthority = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sisapi_authorities")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sisapi-authorities"] });
      toast.success("Autoridade excluída com sucesso");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao excluir autoridade");
    },
  });

  return {
    authorities,
    isLoading,
    createAuthority,
    updateAuthority,
    deleteAuthority,
  };
}
