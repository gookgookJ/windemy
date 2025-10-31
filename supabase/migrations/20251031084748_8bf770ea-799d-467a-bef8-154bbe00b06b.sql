-- Allow public access to instructor profiles
-- This is necessary for guest users to see instructor names when browsing courses

CREATE POLICY "Public can view instructor profiles"
ON public.profiles
FOR SELECT
USING (has_role(id, 'instructor'::app_role));

-- Also allow public to view basic instructor info through the instructors table
CREATE POLICY "Public can view instructors"
ON public.instructors
FOR SELECT
USING (true);