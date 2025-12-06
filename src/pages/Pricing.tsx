import { useState } from 'react';
import { Check, Zap } from 'lucide-react';
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
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-base md:text-xl text-muted-foreground px-4">
            Monitor your workflows with confidence and peace of mind
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-md md:max-w-6xl mx-auto">
          {/* Free Tier */}
          <Card className="glass p-6 md:p-8 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-glow-primary">
            <div className="mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold mb-2">{SUBSCRIPTION_TIERS.free.name}</h3>
              <div className="flex items-baseline gap-2 mb-3 md:mb-4">
                <span className="text-4xl md:text-5xl font-bold">${SUBSCRIPTION_TIERS.free.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">Perfect for getting started</p>
            </div>

            <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
              {SUBSCRIPTION_TIERS.free.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 md:gap-3">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full text-sm md:text-base" 
              variant="outline"
              disabled={profile?.subscription_tier === 'free'}
            >
              {profile?.subscription_tier === 'free' ? 'Current Plan' : 'Free Forever'}
            </Button>
          </Card>

          {/* Pro Monthly */}
          <Card className={`glass p-6 md:p-8 border-primary/50 relative hover:shadow-glow-primary transition-all duration-300 order-first md:order-none ${
            isCurrentPlan(SUBSCRIPTION_TIERS.pro_monthly.productId) ? 'ring-2 ring-primary' : ''
          }`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-medium whitespace-nowrap">
              Most Popular
            </div>
            
            <div className="mb-4 md:mb-6 mt-2 md:mt-0">
              <h3 className="text-xl md:text-2xl font-bold mb-2">{SUBSCRIPTION_TIERS.pro_monthly.name}</h3>
              <div className="flex items-baseline gap-2 mb-3 md:mb-4">
                <span className="text-4xl md:text-5xl font-bold">${SUBSCRIPTION_TIERS.pro_monthly.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">For serious monitoring</p>
            </div>

            <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
              {SUBSCRIPTION_TIERS.pro_monthly.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 md:gap-3">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full shadow-glow-primary text-sm md:text-base" 
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

          {/* Pro Lifetime - Black Friday */}
          <Card className={`glass p-6 md:p-8 border-amber-500/50 relative hover:shadow-glow-accent transition-all duration-300 bg-gradient-to-br from-amber-500/10 to-orange-500/5 ${
            isCurrentPlan(SUBSCRIPTION_TIERS.pro_lifetime.productId) ? 'ring-2 ring-amber-500' : ''
          }`}>
            <div className="absolute -top-3 right-2 md:right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 md:px-4 py-1 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1">
              <Zap className="w-3 h-3" />
              BLACK FRIDAY
            </div>
            
            <div className="mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold mb-2">{SUBSCRIPTION_TIERS.pro_lifetime.name}</h3>
              <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                <span className="text-xl md:text-2xl font-medium text-muted-foreground line-through">$499</span>
                <span className="text-4xl md:text-5xl font-bold text-amber-500">${SUBSCRIPTION_TIERS.pro_lifetime.price}</span>
                <span className="text-muted-foreground text-sm">one-time</span>
              </div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="bg-green-500/20 text-green-400 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold">
                  SAVE 60%
                </span>
                <span className="text-xs md:text-sm text-muted-foreground">$300 off!</span>
              </div>
              <p className="text-xs md:text-sm text-amber-500/80 font-medium">Pay once, use forever!</p>
            </div>

            <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
              {SUBSCRIPTION_TIERS.pro_lifetime.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 md:gap-3">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 text-sm md:text-base" 
              onClick={() => handleSubscribe(SUBSCRIPTION_TIERS.pro_lifetime.priceId, SUBSCRIPTION_TIERS.pro_lifetime.name)}
              disabled={loading === SUBSCRIPTION_TIERS.pro_lifetime.priceId || isCurrentPlan(SUBSCRIPTION_TIERS.pro_lifetime.productId)}
            >
              {loading === SUBSCRIPTION_TIERS.pro_lifetime.priceId 
                ? 'Processing...' 
                : isCurrentPlan(SUBSCRIPTION_TIERS.pro_lifetime.productId)
                ? 'Current Plan'
                : 'Get Lifetime Access'}
            </Button>
          </Card>
        </div>

        <div className="mt-10 md:mt-16 text-center px-4">
          <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">
            All plans include our core monitoring features. Upgrade anytime to unlock unlimited checks.
          </p>
          <p className="text-xs md:text-sm text-muted-foreground">
            Questions? Contact us at support@flowzen.com
          </p>
        </div>
      </div>
    </div>
  );
}
