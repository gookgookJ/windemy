-- Add access duration fields to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS access_duration_days integer DEFAULT NULL;

COMMENT ON COLUMN public.courses.access_duration_days IS 'Number of days the course is accessible after enrollment. NULL means lifetime access.';

-- Add expires_at field to enrollments table
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT NULL;

COMMENT ON COLUMN public.enrollments.expires_at IS 'Date when the enrollment expires. NULL means lifetime access or not yet calculated.';

-- Create function to calculate and set expiry date for enrollments
CREATE OR REPLACE FUNCTION public.calculate_enrollment_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the access_duration_days from the course
  IF NEW.expires_at IS NULL THEN
    SELECT 
      CASE 
        WHEN c.access_duration_days IS NULL THEN NULL
        ELSE NOW() + (c.access_duration_days || ' days')::INTERVAL
      END INTO NEW.expires_at
    FROM public.courses c
    WHERE c.id = NEW.course_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically set expiry date on enrollment
DROP TRIGGER IF EXISTS set_enrollment_expiry ON public.enrollments;
CREATE TRIGGER set_enrollment_expiry
  BEFORE INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_enrollment_expiry();

-- Update existing enrollments to set expiry dates based on course settings
UPDATE public.enrollments e
SET expires_at = CASE 
  WHEN c.access_duration_days IS NULL THEN NULL
  ELSE e.enrolled_at + (c.access_duration_days || ' days')::INTERVAL
END
FROM public.courses c
WHERE e.course_id = c.id AND e.expires_at IS NULL;