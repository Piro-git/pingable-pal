-- Insert profile for existing user
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  '866fd1fc-7def-4920-990e-75166f15b8d3',
  'piro.basil@gmail.com',
  'piro.basil@gmail.com',
  'admin'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role;