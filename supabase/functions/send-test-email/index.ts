import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
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
    const { check_id, check_name, user_email }: TestEmailRequest = await req.json();

    console.log('Sending test email for check:', check_name, 'to:', user_email);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FF6B35, #F7931E); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert-badge { background: #4CAF50; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }
            .check-name { font-size: 24px; margin: 10px 0; }
            .info-box { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #FF6B35; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="alert-badge">✓ TEST EMAIL</div>
              <div class="check-name">${check_name}</div>
            </div>
            <div class="content">
              <p><strong>This is a test notification from FlowZen.</strong></p>
              
              <div class="info-box">
                <p><strong>Check ID:</strong> ${check_id}</p>
                <p><strong>Check Name:</strong> ${check_name}</p>
                <p><strong>Status:</strong> This is a test - your check is running normally</p>
              </div>

              <p>If you received this email, your email notifications are configured correctly!</p>
              
              <p>You will receive real alerts when your checks go down.</p>
              
              <div class="footer">
                <p>FlowZen Monitoring Platform</p>
                <p>Built with ❤️ for reliable automation</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "FlowZen <hello@getflowzen.com>",
      to: [user_email],
      subject: `✓ Test Email: ${check_name}`,
      html: emailHtml,
    });

    console.log('Test email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Test email sent successfully',
        emailId: emailResponse.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-test-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
