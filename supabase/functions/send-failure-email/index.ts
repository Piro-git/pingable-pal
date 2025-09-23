import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FailureEmailRequest {
  check_id: string;
  check_name: string;
  user_email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { check_id, check_name, user_email }: FailureEmailRequest = await req.json();
    
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

    const emailResponse = await resend.emails.send({
      from: "Health Check Alerts <onboarding@resend.dev>",
      to: [user_email],
      subject: `⚠️ Alert: Your check '${check_name}' is down!`,
      html: `
        <h2>Health Check Alert</h2>
        <p>Hello,</p>
        <p>This is an automated alert to inform you that your check named '<strong>${check_name}</strong>' has been marked as 'down' because we missed a scheduled ping.</p>
        <p>Please check your service and ensure it's responding correctly.</p>
        <p>Check ID: ${check_id}</p>
        <p>Best regards,<br>Your Health Check System</p>
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