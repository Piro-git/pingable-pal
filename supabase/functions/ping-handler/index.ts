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

    // Find the check with the matching heartbeat_uuid (include all needed fields for notifications)
    const { data: check, error: selectError } = await supabase
      .from('checks')
      .select('id, name, last_pinged_at, user_id, interval_minutes, grace_period_minutes, slack_webhook_url')
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

    // Rate limiting: Enforce minimum 30 second interval between pings
    if (check.last_pinged_at) {
      const lastPing = new Date(check.last_pinged_at).getTime();
      const now = Date.now();
      const minInterval = 30 * 1000; // 30 seconds
      
      if (now - lastPing < minInterval) {
        const retryAfter = Math.ceil((minInterval - (now - lastPing)) / 1000);
        console.log(`Rate limit exceeded for check ${check.id}. Retry after ${retryAfter}s`);
        return new Response(
          JSON.stringify({ 
            status: 'error', 
            message: 'Rate limit exceeded. Minimum interval between pings is 30 seconds.',
            retry_after_seconds: retryAfter
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfter)
            } 
          }
        );
      }
    }

    // Parse request body for POST requests with validation
    let requestBody: any = {};
    if (req.method === 'POST') {
      try {
        const text = await req.text();
        
        // Validate payload size (max 10KB)
        if (text.length > 10240) {
          console.log('Payload too large:', text.length, 'bytes');
          return new Response(
            JSON.stringify({ status: 'error', message: 'Payload too large. Maximum size is 10KB.' }),
            { 
              status: 413, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
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

    // Extract and validate data from request body
    const runStatus = requestBody.status || 'success';
    
    // Validate status field
    if (!['success', 'failed', 'pending'].includes(runStatus)) {
      return new Response(
        JSON.stringify({ status: 'error', message: "Invalid status. Must be 'success', 'failed', or 'pending'." }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const payload = requestBody.payload || {};
    const errorMessage = requestBody.error_message || null;
    
    // Validate error message length
    if (errorMessage && typeof errorMessage === 'string' && errorMessage.length > 1000) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Error message too long. Maximum length is 1000 characters.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    let durationMs = requestBody.duration_ms || null;
    
    // Validate duration
    if (durationMs !== null && durationMs !== undefined) {
      const parsedDuration = parseInt(durationMs);
      if (isNaN(parsedDuration) || parsedDuration < 0 || parsedDuration > 3600000) {
        return new Response(
          JSON.stringify({ status: 'error', message: 'Invalid duration. Must be between 0 and 3600000 ms.' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      durationMs = parsedDuration;
    }

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

    // Send notifications if check went down due to failed status
    if (checkStatus === 'down') {
      console.log('Check is down, sending notifications...');
      
      // Get user email from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', check.user_id)
        .single();
      
      if (profileError) {
        console.error('Failed to fetch user profile:', profileError);
      }
      
      const userEmail = profile?.email;
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      
      // Send email notification
      if (userEmail) {
        try {
          console.log('Sending failure email to:', userEmail);
          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-failure-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              check_id: check.id,
              check_name: check.name,
              user_email: userEmail,
              last_pinged_at: new Date().toISOString(),
              interval_minutes: check.interval_minutes,
              grace_period_minutes: check.grace_period_minutes,
              error_message: errorMessage,
              payload: payload,
              duration_ms: durationMs
            })
          });
          
          if (emailResponse.ok) {
            console.log('Failure email sent successfully');
          } else {
            console.error('Failed to send failure email:', await emailResponse.text());
          }
        } catch (emailError) {
          console.error('Error sending failure email:', emailError);
        }
      }
      
      // Send Slack notification if configured
      if (check.slack_webhook_url) {
        try {
          console.log('Sending Slack notification');
          const slackResponse = await fetch(`${supabaseUrl}/functions/v1/send-slack-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              check_id: check.id,
              check_name: check.name,
              slack_webhook_url: check.slack_webhook_url,
              status: 'down',
              last_pinged_at: new Date().toISOString(),
              interval_minutes: check.interval_minutes,
              grace_period_minutes: check.grace_period_minutes
            })
          });
          
          if (slackResponse.ok) {
            console.log('Slack notification sent successfully');
          } else {
            console.error('Failed to send Slack notification:', await slackResponse.text());
          }
        } catch (slackError) {
          console.error('Error sending Slack notification:', slackError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        message: 'Report received successfully',
        check_id: check.id,
        run_id: checkRun.id,
        notifications_sent: checkStatus === 'down'
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