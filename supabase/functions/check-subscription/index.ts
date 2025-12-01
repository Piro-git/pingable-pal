import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Lifetime product ID for one-time payment verification
const LIFETIME_PRODUCT_ID = "prod_TWgqQeDsWNKWSl";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      
      // Update profile to free tier
      await supabaseClient
        .from('profiles')
        .update({
          subscription_status: 'free',
          subscription_tier: 'free',
          stripe_customer_id: null,
          stripe_subscription_id: null,
          stripe_product_id: null,
          subscription_end_date: null
        })
        .eq('id', user.id);
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: 'free',
        subscription_status: 'free'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // First check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionId = null;
    let subscriptionEnd = null;
    let subscriptionStatus = 'free';
    let isLifetime = false;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionId = subscription.id;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      subscriptionStatus = subscription.status;
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      productId = subscription.items.data[0].price.product as string;
      logStep("Determined subscription product", { productId });
      
      // Update profile with subscription data
      await supabaseClient
        .from('profiles')
        .update({
          subscription_status: subscriptionStatus,
          subscription_tier: 'pro',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_product_id: productId,
          subscription_end_date: subscriptionEnd
        })
        .eq('id', user.id);
    } else {
      // Check for lifetime one-time payment via checkout sessions
      logStep("No active subscription, checking for lifetime purchase");
      
      const sessions = await stripe.checkout.sessions.list({
        customer: customerId,
        limit: 100,
      });
      
      // Look for a successful payment for the lifetime product
      const lifetimePurchase = sessions.data.find(session => 
        session.payment_status === 'paid' && 
        session.mode === 'payment'
      );
      
      if (lifetimePurchase) {
        // Verify this is the lifetime product by checking line items
        const lineItems = await stripe.checkout.sessions.listLineItems(lifetimePurchase.id);
        const hasLifetimeProduct = lineItems.data.some(item => {
          const priceProduct = item.price?.product;
          return priceProduct === LIFETIME_PRODUCT_ID;
        });
        
        if (hasLifetimeProduct) {
          isLifetime = true;
          productId = LIFETIME_PRODUCT_ID;
          subscriptionStatus = 'lifetime';
          logStep("Lifetime purchase found", { sessionId: lifetimePurchase.id });
          
          // Update profile with lifetime data
          await supabaseClient
            .from('profiles')
            .update({
              subscription_status: 'lifetime',
              subscription_tier: 'pro',
              stripe_customer_id: customerId,
              stripe_subscription_id: null,
              stripe_product_id: productId,
              subscription_end_date: null // Lifetime has no end date
            })
            .eq('id', user.id);
        }
      }
      
      if (!isLifetime) {
        logStep("No active subscription or lifetime purchase found");
        
        // Update profile to free tier
        await supabaseClient
          .from('profiles')
          .update({
            subscription_status: 'free',
            subscription_tier: 'free',
            stripe_customer_id: customerId,
            stripe_subscription_id: null,
            stripe_product_id: null,
            subscription_end_date: null
          })
          .eq('id', user.id);
      }
    }

    const hasAccess = hasActiveSub || isLifetime;

    return new Response(JSON.stringify({
      subscribed: hasAccess,
      subscription_tier: hasAccess ? 'pro' : 'free',
      subscription_status: subscriptionStatus,
      product_id: productId,
      subscription_end: subscriptionEnd,
      is_lifetime: isLifetime
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
