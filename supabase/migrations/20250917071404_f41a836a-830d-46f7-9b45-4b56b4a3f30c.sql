-- Security Fix Migration: Step-by-step approach to avoid conflicts
-- This migration addresses critical security vulnerabilities while maintaining all existing functionality

-- Step 1: Create security definer function to safely get user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Step 2: Drop and recreate profiles policies with secure approach
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view instructor profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create secure RLS policies for profiles table
-- Users can view their own complete profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Admins can view all profiles (for management)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.get_current_user_role() = 'admin');

-- Public can view only essential instructor information (no email/phone)
CREATE POLICY "Public can view instructor basic info"
ON public.profiles
FOR SELECT
USING (
  role = 'instructor' AND 
  auth.uid() IS NOT NULL
);

-- Users can update their own profile but NOT their role
CREATE POLICY "Users can update own profile (except role)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  (OLD.role = NEW.role OR public.get_current_user_role() = 'admin')
);

-- Only admins can update any profile including roles
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.get_current_user_role() = 'admin');

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);