-- Add marketing consent field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN marketing_consent boolean DEFAULT false;