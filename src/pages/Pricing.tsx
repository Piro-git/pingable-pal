import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SUBSCRIPTION_TIERS } from '@/utils/subscriptionTiers';

export default function Pricing() {
  const { user, profile, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string, tierName: string) => {
    if (!user || !session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
      return;
    }

    setLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout process",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const isCurrentPlan = (productId: string | null) => {
    return profile?.stripe_product_id === productId;
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground">
            Monitor your workflows with confidence and peace of mind
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Tier */}
          <Card className="glass p-8 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-glow-primary">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">{SUBSCRIPTION_TIERS.free.name}</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold">${SUBSCRIPTION_TIERS.free.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground">Perfect for getting started</p>
            </div>

            <ul className="space-y-4 mb-8">
              {SUBSCRIPTION_TIERS.free.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full" 
              variant="outline"
              disabled={profile?.subscription_tier === 'free'}
            >
              {profile?.subscription_tier === 'free' ? 'Current Plan' : 'Free Forever'}
            </Button>
          </Card>

          {/* Pro Monthly */}
          <Card className={`glass p-8 border-primary/50 relative hover:shadow-glow-primary transition-all duration-300 ${
            isCurrentPlan(SUBSCRIPTION_TIERS.pro_monthly.productId) ? 'ring-2 ring-primary' : ''
          }`}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </div>
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">{SUBSCRIPTION_TIERS.pro_monthly.name}</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold">${SUBSCRIPTION_TIERS.pro_monthly.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground">For serious monitoring</p>
            </div>

            <ul className="space-y-4 mb-8">
              {SUBSCRIPTION_TIERS.pro_monthly.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full shadow-glow-primary" 
              onClick={() => handleSubscribe(SUBSCRIPTION_TIERS.pro_monthly.priceId, SUBSCRIPTION_TIERS.pro_monthly.name)}
              disabled={loading === SUBSCRIPTION_TIERS.pro_monthly.priceId || isCurrentPlan(SUBSCRIPTION_TIERS.pro_monthly.productId)}
            >
              {loading === SUBSCRIPTION_TIERS.pro_monthly.priceId 
                ? 'Processing...' 
                : isCurrentPlan(SUBSCRIPTION_TIERS.pro_monthly.productId)
                ? 'Current Plan'
                : 'Subscribe Now'}
            </Button>
          </Card>

          {/* Pro Yearly */}
          <Card className={`glass p-8 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-glow-primary ${
            isCurrentPlan(SUBSCRIPTION_TIERS.pro_yearly.productId) ? 'ring-2 ring-primary' : ''
          }`}>
            <div className="absolute -top-4 right-4 bg-success text-success-foreground px-3 py-1 rounded-full text-xs font-medium">
              Save 17%
            </div>
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">{SUBSCRIPTION_TIERS.pro_yearly.name}</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold">${SUBSCRIPTION_TIERS.pro_yearly.price}</span>
                <span className="text-muted-foreground">/year</span>
              </div>
              <p className="text-sm text-muted-foreground">Best value for committed teams</p>
            </div>

            <ul className="space-y-4 mb-8">
              {SUBSCRIPTION_TIERS.pro_yearly.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full shadow-glow-accent" 
              variant="secondary"
              onClick={() => handleSubscribe(SUBSCRIPTION_TIERS.pro_yearly.priceId, SUBSCRIPTION_TIERS.pro_yearly.name)}
              disabled={loading === SUBSCRIPTION_TIERS.pro_yearly.priceId || isCurrentPlan(SUBSCRIPTION_TIERS.pro_yearly.productId)}
            >
              {loading === SUBSCRIPTION_TIERS.pro_yearly.priceId 
                ? 'Processing...' 
                : isCurrentPlan(SUBSCRIPTION_TIERS.pro_yearly.productId)
                ? 'Current Plan'
                : 'Subscribe Yearly'}
            </Button>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            All plans include our core monitoring features. Upgrade anytime to unlock unlimited checks.
          </p>
          <p className="text-sm text-muted-foreground">
            Questions? Contact us at support@flowzen.com
          </p>
        </div>
      </div>
    </div>
  );
}
