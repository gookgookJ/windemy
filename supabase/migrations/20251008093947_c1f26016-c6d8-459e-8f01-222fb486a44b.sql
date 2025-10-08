-- Ensure anonymous and authenticated users can execute public instructor RPCs
GRANT EXECUTE ON FUNCTION public.get_instructors_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_instructor_safe(uuid) TO anon, authenticated;