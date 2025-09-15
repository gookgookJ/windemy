-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update profiles table to properly reference auth.users
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_pkey,
  ADD PRIMARY KEY (id),
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;