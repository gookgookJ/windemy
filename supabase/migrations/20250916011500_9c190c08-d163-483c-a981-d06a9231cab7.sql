-- Delete all purchase history for sksmsanj32@gmail.com (user_id: b333049e-f94f-4834-9407-6be11a7e54de)

-- 1. Delete enrollments first
DELETE FROM public.enrollments 
WHERE user_id = 'b333049e-f94f-4834-9407-6be11a7e54de';

-- 2. Delete order items
DELETE FROM public.order_items 
WHERE order_id IN (
  SELECT id FROM public.orders 
  WHERE user_id = 'b333049e-f94f-4834-9407-6be11a7e54de'
);

-- 3. Delete orders
DELETE FROM public.orders 
WHERE user_id = 'b333049e-f94f-4834-9407-6be11a7e54de';