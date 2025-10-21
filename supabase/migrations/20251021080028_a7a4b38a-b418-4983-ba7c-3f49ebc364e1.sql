-- Add RPC function to increment coupon used count
CREATE OR REPLACE FUNCTION public.increment_coupon_used_count(coupon_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE id = coupon_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_coupon_used_count(uuid) TO authenticated;