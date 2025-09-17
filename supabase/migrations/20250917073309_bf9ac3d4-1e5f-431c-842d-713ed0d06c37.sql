-- Fix security definer view issue
DROP VIEW IF EXISTS public.instructors_public_safe;

-- Create a regular view without SECURITY DEFINER
CREATE VIEW public.instructors_public_safe AS
SELECT 
  id,
  full_name,
  instructor_bio,
  instructor_avatar_url,
  created_at,
  updated_at
FROM public.profiles
WHERE role = 'instructor';

-- Grant access to both roles
GRANT SELECT ON public.instructors_public_safe TO anon, authenticated;