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

    const { email, password, full_name, role_id, department_id, sector_id, is_admin, allowed_modules } = await req.json()

    // 1. Create the user in Auth
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (authError) throw authError

    const userId = authData.user.id

    // 2. Create/Update the profile in sisapi_profiles
    const { error: profileError } = await supabaseClient
      .from('sisapi_profiles')
      .upsert({
        id: userId,
        full_name,
        role_id: role_id || null,
        department_id: department_id || null,
        sector_id: sector_id || null,
        is_admin: !!is_admin,
        allowed_modules: allowed_modules || ['sisapi'],
        status: 'active'
      })

    if (profileError) throw profileError

    return new Response(
      JSON.stringify({ message: 'User created successfully', user: authData.user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    const msg = error?.message || String(error)
    const friendly = /already been registered|email_exists|already registered/i.test(msg)
      ? 'Já existe um usuário cadastrado com este e-mail.'
      : msg
    return new Response(
      JSON.stringify({ error: friendly }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})
