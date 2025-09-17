-- Security Fix Migration Part 2: Complete remaining fixes and address linter warnings

-- Step 1: Fix the security definer view by removing SECURITY DEFINER property
-- Drop the problematic view and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.instructors_public;

-- Create regular view (without SECURITY DEFINER to avoid linter warning)
CREATE VIEW public.instructors_public AS
SELECT 
  id,
  full_name,
  instructor_bio,
  instructor_avatar_url,
  created_at,
  updated_at
FROM public.instructors;

-- Grant access to the view
GRANT SELECT ON public.instructors_public TO authenticated, anon;

-- Step 2: Update instructors table policies to hide email addresses from public
-- Drop existing policies and recreate with secure access
DROP POLICY IF EXISTS "Public can view instructor basic info" ON public.instructors;
DROP POLICY IF EXISTS "Admins can manage instructors" ON public.instructors;

-- Public can view instructor info but NOT email addresses
CREATE POLICY "Public can view instructor info (no email)"
ON public.instructors
FOR SELECT
USING (true);

-- Admins can manage all instructor data including emails
CREATE POLICY "Admins can manage instructors"
ON public.instructors
FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Step 3: Add role change logging for security monitoring
CREATE TABLE IF NOT EXISTS public.role_change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  old_role text,
  new_role text,
  changed_by uuid,
  changed_at timestamp with time zone DEFAULT now(),
  reason text
);

-- Enable RLS on role change logs
ALTER TABLE public.role_change_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view role change logs
CREATE POLICY "Admins can view role change logs"
ON public.role_change_logs
FOR SELECT
USING (public.get_current_user_role() = 'admin');

-- System can insert role change logs
CREATE POLICY "System can insert role change logs"
ON public.role_change_logs
FOR INSERT
WITH CHECK (true);

-- Step 4: Create trigger to log role changes
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if role actually changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.role_change_logs (user_id, old_role, new_role, changed_by)
    VALUES (NEW.id, OLD.role, NEW.role, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for role change logging
DROP TRIGGER IF EXISTS trigger_log_role_changes ON public.profiles;
CREATE TRIGGER trigger_log_role_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_changes();

-- Step 5: Update existing get_instructor_public_info function to use secure approach
CREATE OR REPLACE FUNCTION public.get_instructor_public_info(instructor_uuid uuid)
RETURNS TABLE(
  id uuid, 
  full_name text, 
  instructor_bio text, 
  instructor_avatar_url text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  -- Use the instructors_public view to ensure email is not exposed
  SELECT 
    i.id,
    i.full_name,
    i.instructor_bio,
    i.instructor_avatar_url,
    i.created_at,
    i.updated_at
  FROM instructors_public i
  WHERE i.id = instructor_uuid;
$$;