import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await userClient.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin',
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const targetUserId = String(body?.user_id ?? '');
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: target, error: getErr } = await adminClient.auth.admin.getUserById(targetUserId);
    if (getErr || !target?.user) {
      return new Response(JSON.stringify({ error: getErr?.message || 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const u: any = target.user;
    const meta = u.raw_user_meta_data || u.user_metadata || {};
    const appMeta = u.raw_app_meta_data || u.app_metadata || {};

    // Try to read last sign-in IP from auth.audit_log_entries
    let last_ip: string | null =
      meta.last_ip ?? meta.last_sign_in_ip ?? appMeta.last_ip ?? null;
    let signup_ip: string | null =
      meta.signup_ip ?? meta.registration_ip ?? appMeta.signup_ip ?? null;

    try {
      const { data: auditRows } = await adminClient
        .schema('auth' as any)
        .from('audit_log_entries' as any)
        .select('payload, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (Array.isArray(auditRows)) {
        // Last login IP
        if (!last_ip) {
          const lastLogin = auditRows.find((r: any) => {
            const p = r.payload || {};
            return (p.action === 'login' || p.action === 'token_refreshed') &&
              (p.actor_id === targetUserId || p.traits?.user_id === targetUserId);
          });
          last_ip = lastLogin?.payload?.ip_address ?? lastLogin?.payload?.traits?.ip_address ?? null;
        }
        // Signup IP — earliest entry referencing this user
        if (!signup_ip) {
          const sorted = [...auditRows].sort((a: any, b: any) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          const signup = sorted.find((r: any) => {
            const p = r.payload || {};
            return p.action === 'user_signedup' &&
              (p.actor_id === targetUserId || p.traits?.user_id === targetUserId);
          });
          signup_ip = signup?.payload?.ip_address ?? signup?.payload?.traits?.ip_address ?? null;
        }
      }
    } catch (_) {
      // audit log may not be queryable — fall back to nulls
    }

    return new Response(JSON.stringify({
      created_at: u.created_at ?? null,
      last_sign_in_at: u.last_sign_in_at ?? null,
      last_ip,
      signup_ip,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});