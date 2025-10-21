-- 쿠폰 RLS 정책 수정: 사용자에게 할당된 쿠폰은 볼 수 있도록 함
DROP POLICY IF EXISTS "Active coupons viewable by authenticated users" ON coupons;

CREATE POLICY "Users can view assigned coupons and active coupons"
ON coupons
FOR SELECT
USING (
  (is_active = true AND valid_until > now() AND auth.uid() IS NOT NULL)
  OR
  (EXISTS (
    SELECT 1 FROM user_coupons
    WHERE user_coupons.coupon_id = coupons.id
    AND user_coupons.user_id = auth.uid()
  ))
);