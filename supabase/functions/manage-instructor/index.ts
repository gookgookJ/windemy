// Supabase Edge Function: manage-instructor
// Creates or updates instructor profiles securely with the service role
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      console.error("ENV_MISSING", { hasUrl: !!SUPABASE_URL, hasService: !!SUPABASE_SERVICE_ROLE_KEY, hasAnon: !!SUPABASE_ANON_KEY });
      return new Response(
        JSON.stringify({ error: "Missing Supabase env configuration" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const authHeader = req.headers.get("Authorization") ?? "";

    // Verify caller (must be admin)
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData?.user) {
      console.error("AUTH_ERROR", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: roleRow, error: roleErr } = await supabaseUser
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (roleErr || !roleRow) {
      console.error("PROFILE_LOOKUP_ERROR", roleErr);
      return new Response(JSON.stringify({ error: "Caller profile not found" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (roleRow.role !== "admin") {
      console.warn("FORBIDDEN_NON_ADMIN", { caller: userData.user.id, role: roleRow.role });
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const payload = await req.json();
    const { id, email, full_name, role = "instructor", instructor_bio, instructor_avatar_url } = payload ?? {};

    if (!id && !email) {
      return new Response(JSON.stringify({ error: "'email' or 'id' is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let userId: string | undefined = id;

    // Ensure there is an auth user for this instructor
    if (!userId && email) {
      // Try to create the user (idempotent with fallback)
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name, role },
      });

      if (createErr) {
        // If already exists, find the existing user by email
        try {
          const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          if (listErr) throw listErr;
          const found = list?.users?.find((u: any) => (u.email || '').toLowerCase() === (email || '').toLowerCase());
          if (!found) throw createErr;
          userId = found.id;
        } catch (listError) {
          console.error('ADMIN_CREATE_OR_LOOKUP_ERROR', createErr, listError);
          return new Response(JSON.stringify({ error: 'Failed to ensure auth user for instructor' }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      } else {
        userId = created?.user?.id;
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unable to resolve instructor user id' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Upsert profile with provided fields (service role bypasses RLS)
    const { error: upsertErr } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          full_name,
          role,
          instructor_bio,
          instructor_avatar_url,
        },
        { onConflict: "id" }
      );

    if (upsertErr) {
      console.error("UPSERT_ERROR", upsertErr);
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e) {
    console.error("UNHANDLED_ERROR", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});