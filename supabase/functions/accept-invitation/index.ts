import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcceptInvitationRequest {
  token: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client with service role
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

    // Get the authenticated user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the user's JWT token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Invalid authentication:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const { token }: AcceptInvitationRequest = await req.json();

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

    console.log('Validating invitation with token for user:', user.email);

    // Fetch the invitation to verify it exists and get details
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (fetchError || !invitation) {
      console.error('Invalid or expired invitation:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invitation' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // CRITICAL SECURITY CHECK: Verify email match
    if (user.email !== invitation.email) {
      console.error(`Email mismatch: User email ${user.email} does not match invitation email ${invitation.email}`);
      return new Response(
        JSON.stringify({ 
          error: 'Email mismatch. This invitation was sent to a different email address.' 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Email verified. Accepting invitation for: ${user.email}`);

    // Update invitation status and link to user
    const { error: updateError } = await supabaseAdmin
      .from('invitations')
      .update({ 
        status: 'accepted',
        accepted_by: user.id,
        accepted_at: new Date().toISOString()
      })
      .eq('token', token)
      .eq('status', 'pending');

    if (updateError) {
      console.error('Failed to update invitation:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to accept invitation' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Assign the role to the user
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({ 
        user_id: user.id, 
        role: invitation.role 
      }, {
        onConflict: 'user_id'
      });

    if (roleError) {
      console.error('Failed to assign role:', roleError);
      // Rollback invitation acceptance
      await supabaseAdmin
        .from('invitations')
        .update({ status: 'pending', accepted_by: null, accepted_at: null })
        .eq('token', token);
        
      return new Response(
        JSON.stringify({ error: 'Failed to assign role' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Invitation accepted and role ${invitation.role} assigned to: ${user.email}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error accepting invitation:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
