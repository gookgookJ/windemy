-- Remove unused and external service replaced tables

-- 1. Drop cart_items table (shopping cart feature removed)
DROP TABLE IF EXISTS public.cart_items CASCADE;

-- 2. Drop support_tickets table (using ChannelTalk instead)
DROP TABLE IF EXISTS public.support_tickets CASCADE;

-- 3. Drop announcements table (will reimplement later)
DROP TABLE IF EXISTS public.announcements CASCADE;

-- 4. Drop system_settings table (not actually used)
DROP TABLE IF EXISTS public.system_settings CASCADE;

-- 5. Remove Stripe payment related columns from orders table
-- Keep payment_method as it will be used for Korean PG integration
ALTER TABLE public.orders DROP COLUMN IF EXISTS stripe_payment_intent_id;