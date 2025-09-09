-- Add instructor profile fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS instructor_bio text,
ADD COLUMN IF NOT EXISTS instructor_avatar_url text;