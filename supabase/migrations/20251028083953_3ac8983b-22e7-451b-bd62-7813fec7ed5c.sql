-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.courses 
DROP CONSTRAINT IF EXISTS courses_instructor_id_fkey;

-- Step 2: Drop email unique constraint permanently (allow duplicate emails for flexibility)
ALTER TABLE public.instructors 
DROP CONSTRAINT IF EXISTS instructors_email_key;

-- Step 3: Migrate existing instructor data from profiles to instructors table
INSERT INTO public.instructors (id, email, full_name, instructor_bio, instructor_avatar_url, created_at, updated_at)
SELECT DISTINCT 
  p.id,
  p.email,
  COALESCE(p.full_name, p.email) as full_name,
  p.instructor_bio,
  p.instructor_avatar_url,
  p.created_at,
  p.updated_at
FROM public.profiles p
INNER JOIN public.courses c ON c.instructor_id = p.id
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  instructor_bio = EXCLUDED.instructor_bio,
  instructor_avatar_url = EXCLUDED.instructor_avatar_url,
  updated_at = EXCLUDED.updated_at;

-- Step 4: Add new foreign key constraint to instructors table
ALTER TABLE public.courses 
ADD CONSTRAINT courses_instructor_id_fkey 
FOREIGN KEY (instructor_id) 
REFERENCES public.instructors(id) 
ON DELETE SET NULL;