export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    interval: null,
    checkLimit: 3,
    features: [
      'Up to 3 monitoring checks',
      'Email notifications',
      'Basic uptime monitoring',
      'Community support'
    ]
  },
  pro_monthly: {
    name: 'Pro Monthly',
    price: 19,
    interval: 'month',
    priceId: 'price_1SZdSZALvN2BffHNPgplq6o2',
    productId: 'prod_TWgqyFQSCQO9mu',
    checkLimit: null, // unlimited
    features: [
      'Unlimited monitoring checks',
      'Email + Slack notifications',
      'Advanced uptime monitoring',
      'Priority support',
      'Custom check intervals'
    ]
  },
  pro_lifetime: {
    name: 'Pro Lifetime',
    price: 199,
    interval: 'lifetime',
    priceId: 'price_1SZdSkALvN2BffHNiqGQptNe',
    productId: 'prod_TWgqQeDsWNKWSl',
    checkLimit: null, // unlimited
    isOneTime: true,
    features: [
      'Unlimited monitoring checks',
      'Email + Slack notifications',
      'Advanced uptime monitoring',
      'Priority support',
      'Custom check intervals',
      '🔥 Black Friday Special - Pay once, use forever!'
    ]
  }
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

export const getSubscriptionTierFromProductId = (productId: string | null): SubscriptionTier => {
  if (!productId) return 'free';
  
  if (productId === SUBSCRIPTION_TIERS.pro_monthly.productId) {
    return 'pro_monthly';
  }
  if (productId === SUBSCRIPTION_TIERS.pro_lifetime.productId) {
    return 'pro_lifetime';
  }
  
  return 'free';
};
