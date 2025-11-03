-- Grant pro subscription access to the owner
UPDATE profiles 
SET 
  subscription_tier = 'pro',
  subscription_status = 'active',
  stripe_product_id = 'prod_TIhwCbsgDaIUPN',
  updated_at = now()
WHERE email = 'piro.basil@gmail.com';