import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Iniciando exclusão do usuário: ${userId}`)

    // 1. Deletar primeiro os registros que podem ter FK para auth.users sem CASCADE
    // Embora sisapi_profiles tenha CASCADE, outras tabelas podem não ter.
    // Vamos tentar deletar o usuário do Auth diretamente, se falhar por FK, saberemos.
    
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Erro ao excluir usuário do Auth:', deleteError)
      
      // Se for erro de FK, vamos tentar limpar as referências conhecidas
      if (deleteError.message.includes('foreign key constraint')) {
        console.log('Detectado erro de chave estrangeira, tentando limpar referências...')
        
        // Exemplo: Notificações
        await supabaseClient.from('sisapi_notifications').delete().eq('user_id', userId)
        
        // Tentar novamente
        const { error: retryError } = await supabaseClient.auth.admin.deleteUser(userId)
        if (retryError) throw retryError
      } else {
        throw deleteError
      }
    }

    console.log(`Usuário ${userId} excluído com sucesso do Auth e do Banco de Dados.`)

    return new Response(
      JSON.stringify({ message: 'Usuário excluído com sucesso' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erro na função delete-user:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Retornamos 200 com o objeto error para o frontend tratar
      }
    )
  }
})