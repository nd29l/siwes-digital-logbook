// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This is a Supabase Edge Function for secure student account creation by administrators.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: missing Supabase environment variables.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Verify caller authorization token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: missing Authorization header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid or expired session token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verify caller is an administrator
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: callerProfile, error: profileCheckError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileCheckError || !callerProfile || callerProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: only SIWES administrators may provision student accounts.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse & validate request payload
    const body = await req.json();
    const {
      email,
      password,
      full_name,
      matric_number,
      phone,
      institution,
      department,
      organisation,
      siwes_start_date,
      siwes_end_date,
    } = body;

    if (!email || !password || !full_name || !matric_number) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, full_name, and matric_number are mandatory.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check matric number uniqueness in profiles
    const { data: existingMatric } = await adminClient
      .from('profiles')
      .select('id')
      .eq('matric_number', matric_number.trim())
      .maybeSingle();

    if (existingMatric) {
      return new Response(
        JSON.stringify({ error: 'A student account with this matriculation number already exists.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Create user in Supabase Auth via Admin API
    const { data: authUser, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
        role: 'student',
        matric_number: matric_number.trim(),
      },
    });

    if (createAuthError || !authUser.user) {
      return new Response(
        JSON.stringify({ error: createAuthError?.message || 'Failed to create student authentication account.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newStudentId = authUser.user.id;

    // 5. Update/upsert the student's profile record with institutional & placement details
    const profilePayload = {
      id: newStudentId,
      email: email.trim().toLowerCase(),
      full_name: full_name.trim(),
      role: 'student',
      matric_number: matric_number.trim(),
      phone: phone?.trim() || null,
      institution: institution?.trim() || null,
      department: department?.trim() || null,
      organisation: organisation?.trim() || null,
      siwes_start_date: siwes_start_date || null,
      siwes_end_date: siwes_end_date || null,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProfile, error: profileUpdateError } = await adminClient
      .from('profiles')
      .upsert(profilePayload)
      .select('*')
      .single();

    if (profileUpdateError) {
      // Rollback: delete the created auth user to avoid orphaned accounts
      await adminClient.auth.admin.deleteUser(newStudentId);
      return new Response(
        JSON.stringify({ error: `Failed to initialize student profile: ${profileUpdateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Return created student data safely (no password or sensitive credentials)
    return new Response(
      JSON.stringify({
        success: true,
        student: updatedProfile,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
