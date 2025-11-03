import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SlackNotificationRequest {
  check_id: string;
  check_name: string;
  slack_webhook_url: string;
  status: string;
  last_pinged_at: string;
  interval_minutes: number;
  grace_period_minutes?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      check_id,
      check_name,
      slack_webhook_url,
      status,
      last_pinged_at,
      interval_minutes,
      grace_period_minutes
    }: SlackNotificationRequest = await req.json();

    console.log(`Sending Slack notification for check: ${check_name} (${check_id})`);

    // Strict webhook URL validation to prevent SSRF attacks
    const ALLOWED_WEBHOOK_PATTERN = /^https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[a-zA-Z0-9]+$/;
    
    if (!slack_webhook_url || !ALLOWED_WEBHOOK_PATTERN.test(slack_webhook_url)) {
      console.error('Invalid Slack webhook URL format:', slack_webhook_url);
      return new Response(
        JSON.stringify({ error: 'Invalid Slack webhook URL format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Calculate time since last ping
    const lastPingDate = new Date(last_pinged_at);
    const now = new Date();
    const timeSinceLastPing = Math.floor((now.getTime() - lastPingDate.getTime()) / 1000 / 60); // in minutes
    
    // Format the time since last ping
    let timeSinceText = '';
    if (timeSinceLastPing < 60) {
      timeSinceText = `${timeSinceLastPing} minute${timeSinceLastPing !== 1 ? 's' : ''} ago`;
    } else {
      const hours = Math.floor(timeSinceLastPing / 60);
      timeSinceText = `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }

    // Determine color based on status
    const color = status === 'down' ? 'danger' : 'good';
    const emoji = status === 'down' ? '🚨' : '✅';

    // Build Slack message using Block Kit
    const slackMessage = {
      attachments: [
        {
          color: color,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `${emoji} Check ${status === 'down' ? 'Down' : 'Up'} Alert`,
                emoji: true,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Check Name:*\n${check_name}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Status:*\n${status === 'down' ? '❌ Down' : '✅ Up'}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Last Ping:*\n${timeSinceText}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Expected Interval:*\nEvery ${interval_minutes} minute${interval_minutes !== 1 ? 's' : ''}`,
                },
              ],
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Check ID: \`${check_id}\` | Last pinged at: ${lastPingDate.toLocaleString()}`,
                },
              ],
            },
            {
              type: 'divider',
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: status === 'down' 
                  ? `⚠️ *Action Required:* This check has failed to ping within the expected ${interval_minutes} minute interval. Please investigate immediately.`
                  : '✅ Check is now operational.',
              },
            },
          ],
        },
      ],
    };

    // Send to Slack webhook
    const slackResponse = await fetch(slack_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    if (!slackResponse.ok) {
      const errorText = await slackResponse.text();
      console.error(`Slack webhook error: ${slackResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send Slack notification',
          details: errorText,
          status: slackResponse.status 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log(`Slack notification sent successfully for check: ${check_name}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Slack notification sent successfully',
        check_id,
        check_name 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in send-slack-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
