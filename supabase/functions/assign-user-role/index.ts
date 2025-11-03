import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssignRoleRequest {
  userId: string;
  role: 'admin' | 'editor' | 'viewer';
  reason?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with the user's JWT token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify user is an admin using RPC function
    const { data: isAdmin, error: roleCheckError } = await supabaseClient.rpc(
      'has_role',
      { _user_id: user.id, _role: 'admin' }
    );

    if (roleCheckError || !isAdmin) {
      console.error('Role check error:', roleCheckError);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const { userId, role, reason }: AssignRoleRequest = await req.json();

    if (!userId || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, role' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate role
    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be admin, editor, or viewer' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Admin ${user.email} attempting to assign ${role} role to user ${userId}`);

    // Call the secure database function that prevents self-assignment and logs changes
    const { error: assignError } = await supabaseClient.rpc('assign_user_role', {
      target_user_id: userId,
      new_role: role,
      change_reason: reason || null,
    });

    if (assignError) {
      console.error('Error assigning role:', assignError);
      
      // Check for specific error messages
      if (assignError.message.includes('Cannot self-assign admin role')) {
        return new Response(
          JSON.stringify({ error: 'Security policy violation: Cannot self-assign admin role' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to assign role', details: assignError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Successfully assigned ${role} role to user ${userId} by ${user.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Role ${role} assigned successfully`,
        userId,
        role
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in assign-user-role function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
