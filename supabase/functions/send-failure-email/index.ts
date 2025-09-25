import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FailureEmailRequest {
  check_id: string;
  check_name: string;
  user_email: string;
  last_pinged_at?: string;
  interval_minutes?: number;
  grace_period_minutes?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { check_id, check_name, user_email, last_pinged_at, interval_minutes, grace_period_minutes }: FailureEmailRequest = await req.json();
    
    // DIAGNOSTIC: Log function invocation
    console.log(`DIAGNOSTIC: 'send-failure-email' invoked for user ${user_email} and check ${check_name}`);

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
    
    const problemDetails = lastPinged 
      ? `
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #dc2626; margin: 0 0 12px 0;">Problem Details:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            <li><strong>Last successful ping:</strong> ${lastPinged.toLocaleString()}</li>
            <li><strong>Expected interval:</strong> Every ${expectedInterval} minutes</li>
            <li><strong>Grace period:</strong> ${gracePeriod} minutes</li>
            <li><strong>Time overdue:</strong> ${overdueMinutes} minutes</li>
            <li><strong>Status changed:</strong> ${now.toLocaleString()}</li>
          </ul>
        </div>
      `
      : `
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #dc2626; margin: 0 0 12px 0;">Problem Details:</h3>
          <p style="margin: 0; color: #374151;">This check has never received a ping and is currently marked as down.</p>
        </div>
      `;

    const emailResponse = await resend.emails.send({
      from: "Health Check Alerts <onboarding@resend.dev>",
      to: [user_email],
      subject: `⚠️ Alert: Your check '${check_name}' is down!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 8px;">🚨 Health Check Alert</h2>
          
          <p>Hello,</p>
          
          <p>This is an automated alert to inform you that your health check named '<strong>${check_name}</strong>' has been marked as <span style="color: #dc2626; font-weight: bold;">DOWN</span>.</p>
          
          ${problemDetails}
          
          <div style="background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0;">
            <h3 style="color: #1f2937; margin: 0 0 8px 0;">What to do next:</h3>
            <ol style="margin: 0; padding-left: 20px; color: #374151;">
              <li>Check if your service is running and accessible</li>
              <li>Verify your ping URL is correctly configured</li>
              <li>Ensure your service can reach our monitoring system</li>
              <li>Review your logs for any recent errors or issues</li>
            </ol>
          </div>
          
          <div style="margin: 24px 0; padding: 12px; background-color: #f9fafb; border-radius: 6px;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              <strong>Check ID:</strong> ${check_id}<br>
              <strong>Check Name:</strong> ${check_name}
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            Your Health Check Monitoring System
          </p>
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