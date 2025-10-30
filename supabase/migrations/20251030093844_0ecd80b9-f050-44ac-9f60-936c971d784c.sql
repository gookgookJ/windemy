-- Remove what_you_will_learn column from courses table
ALTER TABLE public.courses 
DROP COLUMN IF EXISTS what_you_will_learn;