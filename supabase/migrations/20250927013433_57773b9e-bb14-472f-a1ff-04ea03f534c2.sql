-- Remove NEW and HOT badge functionality from courses table
ALTER TABLE public.courses DROP COLUMN IF EXISTS is_new;
ALTER TABLE public.courses DROP COLUMN IF EXISTS is_hot;