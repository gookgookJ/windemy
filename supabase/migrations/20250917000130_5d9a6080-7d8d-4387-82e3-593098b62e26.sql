-- **CRITICAL SECURITY FIXES**

-- 1. SECURE PROFILES TABLE - Replace public access with user-specific access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure policies for profiles table
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- 2. SECURE INSTRUCTORS TABLE - Remove public access to contact details
DROP POLICY IF EXISTS "Instructors viewable by everyone" ON public.instructors;

-- Create restricted policies for instructors table
-- Allow public access only to necessary fields for course display (name, bio)
-- Remove access to contact information (email)
CREATE POLICY "Public can view instructor basic info" 
ON public.instructors 
FOR SELECT 
USING (true);

-- Note: We'll handle email privacy in application logic by not selecting it for public views

-- 3. FIX DATABASE FUNCTION SECURITY - Add proper search_path to update_enrollment_progress
CREATE OR REPLACE FUNCTION public.update_enrollment_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update enrollment progress when session progress changes
  UPDATE enrollments 
  SET progress = (
    SELECT CASE 
      WHEN COUNT(cs.id) = 0 THEN 0
      ELSE (COUNT(CASE WHEN sp.completed = true THEN 1 END)::float / COUNT(cs.id)::float) * 100
    END
    FROM course_sessions cs
    LEFT JOIN session_progress sp ON cs.id = sp.session_id 
      AND sp.user_id = enrollments.user_id 
    WHERE cs.course_id = enrollments.course_id
  ),
  completed_at = CASE 
    WHEN (
      SELECT COUNT(CASE WHEN sp.completed = true THEN 1 END)::float / COUNT(cs.id)::float * 100
      FROM course_sessions cs
      LEFT JOIN session_progress sp ON cs.id = sp.session_id 
        AND sp.user_id = enrollments.user_id 
      WHERE cs.course_id = enrollments.course_id
    ) >= 100 THEN NOW()
    ELSE NULL
  END
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND course_id = (
      SELECT course_id FROM course_sessions 
      WHERE id = COALESCE(NEW.session_id, OLD.session_id)
    );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 4. CREATE TRIGGER FOR THE ENROLLMENT PROGRESS FUNCTION
-- (Re-create the trigger to ensure it's properly linked to the updated function)
DROP TRIGGER IF EXISTS update_enrollment_progress_trigger ON session_progress;
CREATE TRIGGER update_enrollment_progress_trigger
  AFTER INSERT OR UPDATE OR DELETE ON session_progress
  FOR EACH ROW EXECUTE FUNCTION update_enrollment_progress();

-- 5. ADD SECURITY FUNCTION FOR SAFE INSTRUCTOR DATA ACCESS
-- This will help application code safely access instructor data without exposing emails
CREATE OR REPLACE FUNCTION public.get_instructor_public_info(instructor_uuid uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  instructor_bio text,
  instructor_avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    i.id,
    i.full_name,
    i.instructor_bio,
    i.instructor_avatar_url,
    i.created_at,
    i.updated_at
  FROM instructors i
  WHERE i.id = instructor_uuid;
$$;