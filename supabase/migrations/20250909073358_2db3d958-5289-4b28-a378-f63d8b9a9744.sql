-- Promote current user to admin for instructor management
UPDATE public.profiles
SET role = 'admin', updated_at = now()
WHERE id = 'eca70779-ecd7-4fe5-b668-e6be42b109a1';