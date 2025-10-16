import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const uuid = url.searchParams.get('uuid');

    console.log(`${req.method} request received for UUID:`, uuid);

    if (!uuid) {
      console.log('No UUID provided');
      return new Response(
        JSON.stringify({ status: 'error', message: 'UUID parameter is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role key for database access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find the check with the matching heartbeat_uuid
    const { data: check, error: selectError } = await supabase
      .from('checks')
      .select('id, name')
      .eq('heartbeat_uuid', uuid)
      .single();

    if (selectError || !check) {
      console.log('Check not found for UUID:', uuid, selectError);
      return new Response(
        JSON.stringify({ status: 'not_found', message: 'Check not found' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Found check:', check.name);

    // Parse request body for POST requests
    let requestBody: any = {};
    if (req.method === 'POST') {
      try {
        const text = await req.text();
        if (text) {
          requestBody = JSON.parse(text);
          console.log('Parsed request body:', requestBody);
        }
      } catch (parseError) {
        console.error('Failed to parse request body:', parseError);
        return new Response(
          JSON.stringify({ status: 'error', message: 'Invalid JSON payload' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Extract data from request body with defaults
    const runStatus = requestBody.status || 'success';
    const payload = requestBody.payload || {};
    const errorMessage = requestBody.error_message || null;
    const durationMs = requestBody.duration_ms || null;

    // Determine the check status (up if success, down if failed)
    const checkStatus = runStatus === 'success' ? 'up' : 'down';

    // Update the check's last_pinged_at and status
    const { error: updateError } = await supabase
      .from('checks')
      .update({
        last_pinged_at: new Date().toISOString(),
        status: checkStatus
      })
      .eq('heartbeat_uuid', uuid);

    if (updateError) {
      console.error('Failed to update check:', updateError);
      return new Response(
        JSON.stringify({ status: 'error', message: 'Failed to update check' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully updated check:', check.name, 'to status:', checkStatus);

    // Create a check_run entry
    const { data: checkRun, error: insertError } = await supabase
      .from('check_runs')
      .insert({
        check_id: check.id,
        status: runStatus,
        payload: payload,
        error_message: errorMessage,
        duration_ms: durationMs
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create check_run:', insertError);
      // Don't fail the entire request if check_run creation fails
      return new Response(
        JSON.stringify({ 
          status: 'partial_success', 
          message: 'Check updated but failed to log run details',
          check_id: check.id 
        }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully created check_run:', checkRun.id);

    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        message: 'Report received successfully',
        check_id: check.id,
        run_id: checkRun.id
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ status: 'error', message: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});