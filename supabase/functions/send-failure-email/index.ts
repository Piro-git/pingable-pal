import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Type definitions for rich automation failure data
interface AutomationDetails {
  platform?: string;
  workflow_name?: string;
  workflow_id?: string;
  execution_id?: string;
  execution_url?: string;
}

interface FailedStepDetails {
  name?: string;
  type?: string;
  position?: number;
  total_steps?: number;
}

interface ErrorDetails {
  type?: string;
  code?: string;
  details?: string;
}

interface ContextDetails {
  input_data?: Record<string, any>;
  retry_count?: number;
  started_at?: string;
}

interface FailureEmailRequest {
  check_id: string;
  check_name: string;
  user_email: string;
  last_pinged_at?: string;
  interval_minutes?: number;
  grace_period_minutes?: number;
  // Basic API Report fields
  error_message?: string;
  payload?: Record<string, any>;
  duration_ms?: number;
  // Rich automation data
  automation?: AutomationDetails;
  failed_step?: FailedStepDetails;
  error?: ErrorDetails;
  context?: ContextDetails;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      check_id, 
      check_name, 
      user_email, 
      last_pinged_at, 
      interval_minutes, 
      grace_period_minutes, 
      error_message, 
      payload, 
      duration_ms,
      automation,
      failed_step,
      error,
      context
    }: FailureEmailRequest = await req.json();
    
    // DIAGNOSTIC: Log function invocation
    console.log(`DIAGNOSTIC: 'send-failure-email' invoked for user ${user_email} and check ${check_name}`);
    console.log('Rich automation data received:', { automation, failed_step, error, context });

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("DIAGNOSTIC ERROR: Failed to retrieve Resend API Key. It might not be set.");
      console.error("RESEND_API_KEY not found in environment variables");
      return new Response(
        JSON.stringify({ error: "Resend API key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // DIAGNOSTIC: Log successful API key retrieval
    console.log("DIAGNOSTIC: Successfully retrieved Resend API Key.");

    const resend = new Resend(resendApiKey);

    console.log(`Sending failure notification for check ${check_name} to ${user_email}`);

    // Calculate how long the check has been overdue
    const lastPinged = last_pinged_at ? new Date(last_pinged_at) : null;
    const now = new Date();
    const overdueMinutes = lastPinged ? Math.floor((now.getTime() - lastPinged.getTime()) / 60000) : 0;
    const expectedInterval = interval_minutes || 0;
    const gracePeriod = grace_period_minutes || 60;
    
    // Check if we have rich automation data
    const hasAutomation = automation && Object.keys(automation).length > 0;
    const hasFailedStep = failed_step && Object.keys(failed_step).length > 0;
    const hasError = error && Object.keys(error).length > 0;
    const hasContext = context && Object.keys(context).length > 0;
    const hasRichData = hasAutomation || hasFailedStep || hasError || hasContext;
    
    // Check if this is a basic API report (has error_message, payload, or duration_ms but no rich data)
    const isBasicApiReport = !hasRichData && (error_message || payload || duration_ms);
    
    // Build Automation Details section
    const automationSection = hasAutomation ? `
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #1e40af; margin: 0 0 12px 0;">🔄 Automation Details</h3>
          <table style="width: 100%; border-collapse: collapse; color: #374151;">
            ${automation.platform ? `<tr><td style="padding: 4px 8px 4px 0; font-weight: 600; width: 120px;">Platform:</td><td style="padding: 4px 0;">${automation.platform}</td></tr>` : ''}
            ${automation.workflow_name ? `<tr><td style="padding: 4px 8px 4px 0; font-weight: 600;">Workflow:</td><td style="padding: 4px 0;">${automation.workflow_name}</td></tr>` : ''}
            ${automation.workflow_id ? `<tr><td style="padding: 4px 8px 4px 0; font-weight: 600;">Workflow ID:</td><td style="padding: 4px 0; font-family: monospace; font-size: 12px;">${automation.workflow_id}</td></tr>` : ''}
            ${automation.execution_id ? `<tr><td style="padding: 4px 8px 4px 0; font-weight: 600;">Execution ID:</td><td style="padding: 4px 0; font-family: monospace; font-size: 12px;">${automation.execution_id}</td></tr>` : ''}
          </table>
          ${automation.execution_url ? `<a href="${automation.execution_url}" target="_blank" style="display: inline-block; margin-top: 12px; color: #2563eb; text-decoration: none; font-weight: 500;">View Execution →</a>` : ''}
        </div>
      ` : '';
    
    // Build Failed Step section
    const failedStepSection = hasFailedStep ? `
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #dc2626; margin: 0 0 12px 0;">❌ Failed Step${failed_step.position && failed_step.total_steps ? ` (${failed_step.position} of ${failed_step.total_steps})` : ''}</h3>
          <table style="width: 100%; border-collapse: collapse; color: #374151;">
            ${failed_step.name ? `<tr><td style="padding: 4px 8px 4px 0; font-weight: 600; width: 120px;">Step Name:</td><td style="padding: 4px 0;">${failed_step.name}</td></tr>` : ''}
            ${failed_step.type ? `<tr><td style="padding: 4px 8px 4px 0; font-weight: 600;">Step Type:</td><td style="padding: 4px 0; font-family: monospace; font-size: 12px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; display: inline-block;">${failed_step.type}</td></tr>` : ''}
          </table>
        </div>
      ` : '';
    
    // Build Error section
    const errorSection = hasError ? `
        <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #92400e; margin: 0 0 12px 0;">⚠️ Error Information</h3>
          <table style="width: 100%; border-collapse: collapse; color: #374151;">
            ${error.type ? `<tr><td style="padding: 4px 8px 4px 0; font-weight: 600; width: 120px;">Error Type:</td><td style="padding: 4px 0;">${error.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td></tr>` : ''}
            ${error.code ? `<tr><td style="padding: 4px 8px 4px 0; font-weight: 600;">Error Code:</td><td style="padding: 4px 0; font-family: monospace; font-size: 12px; background: #fee2e2; color: #dc2626; padding: 2px 6px; border-radius: 4px; display: inline-block;">${error.code}</td></tr>` : ''}
            ${error.details ? `<tr><td style="padding: 4px 8px 4px 0; font-weight: 600; vertical-align: top;">Details:</td><td style="padding: 4px 0;">${error.details}</td></tr>` : ''}
          </table>
        </div>
      ` : '';
    
    // Build Context section
    const contextSection = hasContext ? `
        <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #374151; margin: 0 0 12px 0;">📋 Execution Context</h3>
          <table style="width: 100%; border-collapse: collapse; color: #374151;">
            ${context.started_at ? `<tr><td style="padding: 4px 8px 4px 0; font-weight: 600; width: 120px;">Started:</td><td style="padding: 4px 0;">${new Date(context.started_at).toLocaleString()}</td></tr>` : ''}
            ${context.retry_count !== undefined ? `<tr><td style="padding: 4px 8px 4px 0; font-weight: 600;">Retries:</td><td style="padding: 4px 0;">${context.retry_count}</td></tr>` : ''}
            ${duration_ms !== undefined ? `<tr><td style="padding: 4px 8px 4px 0; font-weight: 600;">Duration:</td><td style="padding: 4px 0;">${duration_ms}ms</td></tr>` : ''}
          </table>
          ${context.input_data && Object.keys(context.input_data).length > 0 ? `
            <div style="margin-top: 12px;">
              <strong style="display: block; margin-bottom: 6px;">Input Data:</strong>
              <pre style="background: #e5e7eb; padding: 12px; border-radius: 6px; margin: 0; overflow-x: auto; font-size: 12px; font-family: monospace;">${JSON.stringify(context.input_data, null, 2)}</pre>
            </div>
          ` : ''}
        </div>
      ` : '';
    
    // Basic API Report Details section (only shown for basic API reports without rich data)
    const basicApiReportDetails = isBasicApiReport ? `
        <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #92400e; margin: 0 0 12px 0;">📋 API Report Details:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            ${error_message ? `<li><strong>Error Message:</strong> <span style="color: #dc2626;">${error_message}</span></li>` : ''}
            ${duration_ms !== undefined ? `<li><strong>Duration:</strong> ${duration_ms}ms</li>` : ''}
            ${payload && Object.keys(payload).length > 0 ? `<li><strong>Custom Payload:</strong> <pre style="background: #f3f4f6; padding: 8px; border-radius: 4px; margin-top: 4px; overflow-x: auto; font-size: 12px;">${JSON.stringify(payload, null, 2)}</pre></li>` : ''}
          </ul>
          <p style="margin: 12px 0 0 0; font-size: 12px; color: #6b7280;">This failure was reported via your automation's API call.</p>
        </div>
      ` : '';
    
    // Simple error message display (when we have rich data but also a summary error message)
    const simpleErrorMessage = hasRichData && error_message ? `
        <div style="background-color: #fee2e2; border-radius: 6px; padding: 12px; margin: 16px 0;">
          <strong style="color: #dc2626;">Error:</strong> <span style="color: #991b1b;">${error_message}</span>
        </div>
      ` : '';

    const problemDetails = lastPinged 
      ? `
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #374151; margin: 0 0 12px 0;">⏱️ Timing Details:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            <li><strong>Last successful ping:</strong> ${lastPinged.toLocaleString()}</li>
            <li><strong>Expected interval:</strong> Every ${expectedInterval} minutes</li>
            <li><strong>Grace period:</strong> ${gracePeriod} minutes</li>
            <li><strong>Status changed:</strong> ${now.toLocaleString()}</li>
          </ul>
        </div>
      `
      : `
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #374151; margin: 0 0 12px 0;">⏱️ Timing Details:</h3>
          <p style="margin: 0; color: #374151;">This check has never received a ping and is currently marked as down.</p>
        </div>
      `;

    const emailResponse = await resend.emails.send({
      from: "FlowZen Alerts <hello@getflowzen.com>",
      to: [user_email],
      subject: `⚠️ Alert: Your check '${check_name}' is down!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 24px; border-radius: 8px 8px 0 0;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px;">🚨 FlowZen Alert</h2>
          </div>
          
          <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; margin: 0 0 16px 0;">Hello,</p>
            
            <p style="color: #374151; margin: 0 0 16px 0;">
              Your health check <strong style="color: #111827;">'${check_name}'</strong> has been marked as 
              <span style="background-color: #fee2e2; color: #dc2626; font-weight: bold; padding: 2px 8px; border-radius: 4px;">DOWN</span>
            </p>
            
            ${simpleErrorMessage}
            ${automationSection}
            ${failedStepSection}
            ${errorSection}
            ${contextSection}
            ${basicApiReportDetails}
            ${problemDetails}
            
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #1e40af; margin: 0 0 8px 0;">💡 What to do next:</h3>
              <ol style="margin: 0; padding-left: 20px; color: #374151;">
                <li>Check if your service is running and accessible</li>
                <li>Verify your ping URL is correctly configured</li>
                <li>Ensure your service can reach our monitoring system</li>
                <li>Review your logs for any recent errors or issues</li>
              </ol>
            </div>
            
            <div style="margin: 24px 0; padding: 12px; background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 13px; color: #6b7280;">
                <strong>Check ID:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${check_id}</code><br>
                <strong>Check Name:</strong> ${check_name}
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0 0;">
              Best regards,<br>
              <strong>FlowZen Monitoring</strong>
            </p>
          </div>
        </div>
      `,
    });

    // DIAGNOSTIC: Log successful email sending
    console.log(`DIAGNOSTIC SUCCESS: Email sent. Resend response ID: ${emailResponse.data?.id || 'No ID returned'}`);
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    // DIAGNOSTIC: Log error details
    console.error(`DIAGNOSTIC ERROR: Resend API call failed. Reason: ${error.message}`);
    console.error("Error in send-failure-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
