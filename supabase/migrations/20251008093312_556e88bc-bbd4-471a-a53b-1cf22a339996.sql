-- Fix instructor info visibility for non-logged-in users
-- Add SECURITY DEFINER to allow anon users to access public instructor information

-- Drop and recreate get_instructor_public_info with SECURITY DEFINER
DROP FUNCTION IF EXISTS public.get_instructor_public_info(uuid);

CREATE OR REPLACE FUNCTION public.get_instructor_public_info(instructor_id uuid)
RETURNS TABLE (
    id uuid,
    full_name text,
    instructor_bio text,
    instructor_avatar_url text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER  -- This allows the function to bypass RLS and execute with elevated permissions
SET search_path = public
AS $$
  SELECT 
    id, 
    full_name, 
    instructor_bio, 
    instructor_avatar_url,
    created_at,
    updated_at
  FROM public.instructors
  WHERE id = instructor_id;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.get_instructor_public_info(uuid) TO anon, authenticated;