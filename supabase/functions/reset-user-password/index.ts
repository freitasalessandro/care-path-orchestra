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

    const { userId, password } = await req.json()

    if (!userId || !password) {
      throw new Error('ID do usuário e senha são obrigatórios.')
    }

    // 1. Update the user password in Auth
    const { error: authError } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { password }
    )

    if (authError) throw authError

    // 2. Update the profile flag to force change
    const { error: profileError } = await supabaseClient
      .from('sisapi_profiles')
      .update({ must_change_password: true })
      .eq('id', userId)

    if (profileError) throw profileError

    return new Response(
      JSON.stringify({ message: 'Password reset successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 with error object for easier handling in frontend
      }
    )
  }
})
