-- Add subscription tracking columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN subscription_status text DEFAULT 'free',
ADD COLUMN subscription_tier text DEFAULT 'free',
ADD COLUMN stripe_customer_id text,
ADD COLUMN stripe_subscription_id text,
ADD COLUMN stripe_product_id text,
ADD COLUMN subscription_end_date timestamp with time zone;

-- Create index for faster subscription lookups
CREATE INDEX idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- Create function to check subscription limits
CREATE OR REPLACE FUNCTION public.check_subscription_limit(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN p.subscription_tier = 'pro' THEN true
      WHEN p.subscription_tier = 'free' THEN (
        SELECT COUNT(*) FROM checks WHERE user_id = user_id_param
      ) < 3
      ELSE false
    END
  FROM profiles p
  WHERE p.id = user_id_param;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.check_subscription_limit IS 'Checks if user can create more checks based on their subscription tier. Free tier: 3 checks max, Pro tier: unlimited';