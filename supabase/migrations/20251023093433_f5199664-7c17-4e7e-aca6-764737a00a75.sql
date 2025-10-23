-- Allow everyone to view instructor profiles (for course search and display)
-- This is safe because we're only exposing instructor-related public information

DROP POLICY IF EXISTS "profiles_select_secure" ON public.profiles;

CREATE POLICY "profiles_select_secure" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can see their own profile
  id = auth.uid() 
  -- Admins can see all profiles
  OR is_admin() 
  -- Everyone can see instructor profiles (needed for course search and display)
  OR has_role(id, 'instructor'::app_role)
);