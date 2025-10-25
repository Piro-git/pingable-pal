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
    price: 29,
    interval: 'month',
    priceId: 'price_1SM6WoALvN2BffHNnrguAlYZ',
    productId: 'prod_TIhwCbsgDaIUPN',
    checkLimit: null, // unlimited
    features: [
      'Unlimited monitoring checks',
      'Email + Slack notifications',
      'Advanced uptime monitoring',
      'Priority support',
      'Custom check intervals'
    ]
  },
  pro_yearly: {
    name: 'Pro Yearly',
    price: 290,
    interval: 'year',
    priceId: 'price_1SM6X3ALvN2BffHNE3pVHqB5',
    productId: 'prod_TIhwVeB2JzxIKk',
    checkLimit: null, // unlimited
    features: [
      'Unlimited monitoring checks',
      'Email + Slack notifications',
      'Advanced uptime monitoring',
      'Priority support',
      'Custom check intervals',
      'Save 17% vs monthly'
    ]
  }
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

export const getSubscriptionTierFromProductId = (productId: string | null): SubscriptionTier => {
  if (!productId) return 'free';
  
  if (productId === SUBSCRIPTION_TIERS.pro_monthly.productId) {
    return 'pro_monthly';
  }
  if (productId === SUBSCRIPTION_TIERS.pro_yearly.productId) {
    return 'pro_yearly';
  }
  
  return 'free';
};
