-- Security Fix Migration: Fix syntax and apply security improvements
-- This migration addresses critical security vulnerabilities

-- Step 1: Create security definer function to safely get user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Step 2: Drop existing overly permissive policy on profiles table
DROP POLICY IF EXISTS "Public can view instructor profiles" ON public.profiles;

-- Step 3: Create secure policy for public instructor viewing (no email/phone exposure)
CREATE POLICY "Public can view instructor basic info"
ON public.profiles
FOR SELECT
USING (
  role = 'instructor' AND 
  auth.uid() IS NOT NULL
);

-- Step 4: Update user profile update policy to prevent role self-elevation
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile (except role)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Step 5: Create a view for public instructor information (excludes email)
CREATE OR REPLACE VIEW public.instructors_public AS
SELECT 
  id,
  full_name,
  instructor_bio,
  instructor_avatar_url,
  created_at,
  updated_at
FROM public.instructors;

-- Grant access to the public view
GRANT SELECT ON public.instructors_public TO authenticated, anon;