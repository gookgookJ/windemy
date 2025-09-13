-- Add tag configuration fields to courses table
ALTER TABLE public.courses 
ADD COLUMN is_hot boolean DEFAULT false,
ADD COLUMN is_new boolean DEFAULT false;