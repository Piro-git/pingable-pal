import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationValidationRequest {
  token: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Parse request body
    const { token }: InvitationValidationRequest = await req.json();

    if (!token) {
      console.error('No token provided');
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Validating invitation token');

    // Use service role to fetch invitation (bypasses RLS)
    const { data: invitation, error } = await supabaseAdmin
      .from('invitations')
      .select('id, email, role, status, team_id')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (error || !invitation) {
      console.error('Invalid or expired invitation token:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invitation token' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Valid invitation found for email: ${invitation.email}`);

    // Return only necessary information (no sensitive token data)
    return new Response(
      JSON.stringify({
        email: invitation.email,
        role: invitation.role,
        team_id: invitation.team_id,
        invitation_id: invitation.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error validating invitation:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
