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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not found in environment variables");
      return new Response(
        JSON.stringify({ error: "Resend API key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);

    const { check_id, check_name, user_email }: FailureEmailRequest = await req.json();

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

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
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