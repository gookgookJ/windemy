
-- Delete all related data for "매출 10배 높이는 Organic 마케팅 전략"

-- 1. Delete user_coupons first (foreign key constraint)
DELETE FROM user_coupons 
WHERE id = 'f9a8fa7e-9269-492d-9212-8aff6fd72d24';

-- 2. Delete order_items
DELETE FROM order_items 
WHERE id = 'b51ccaec-2a74-4032-bf8e-eb7489317e3d';

-- 3. Delete order
DELETE FROM orders 
WHERE id = '193262dc-787c-411a-9e8a-ece56d0f5333';
