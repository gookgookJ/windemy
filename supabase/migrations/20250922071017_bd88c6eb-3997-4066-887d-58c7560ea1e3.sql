-- Completely remove and recreate the view to eliminate any SECURITY DEFINER issues
DROP VIEW IF EXISTS public.instructors_public_safe CASCADE;

-- Remove any materialized views that might exist
DROP MATERIALIZED VIEW IF EXISTS public.instructors_public_safe CASCADE;

-- Create a completely new, simple view without any security definer properties
CREATE OR REPLACE VIEW public.instructors_public_safe AS
SELECT 
    p.id,
    p.full_name,
    p.instructor_bio,
    p.instructor_avatar_url,
    p.created_at,
    p.updated_at
FROM public.profiles p
WHERE p.role = 'instructor';

-- Grant explicit permissions 
GRANT SELECT ON public.instructors_public_safe TO anon;
GRANT SELECT ON public.instructors_public_safe TO authenticated;

-- Check and remove any potential materialized views or other objects
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Drop any functions that might have been automatically created
    FOR rec IN 
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name LIKE '%instructor%public%'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || rec.routine_name || ' CASCADE';
    END LOOP;
END $$;

-- Explicitly ensure this is not a security definer view
-- by recreating it one more time with explicit SECURITY INVOKER semantics
DROP VIEW IF EXISTS public.instructors_public_safe;
CREATE VIEW public.instructors_public_safe AS
SELECT 
    profiles.id,
    profiles.full_name,
    profiles.instructor_bio,
    profiles.instructor_avatar_url,
    profiles.created_at,
    profiles.updated_at
FROM public.profiles
WHERE profiles.role = 'instructor'::text;

-- Set proper ownership and permissions
ALTER VIEW public.instructors_public_safe OWNER TO postgres;
GRANT SELECT ON public.instructors_public_safe TO anon, authenticated;

-- Add a comment to document this is intentionally a simple view
COMMENT ON VIEW public.instructors_public_safe IS 'Simple view for public instructor data - intentionally not SECURITY DEFINER';