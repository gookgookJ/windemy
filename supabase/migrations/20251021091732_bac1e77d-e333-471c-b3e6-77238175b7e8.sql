
-- Delete all related data for jayce@windly.cc and "공동구매 중개의 정석" course

-- 1. Delete points_transactions first (foreign key constraint)
DELETE FROM points_transactions 
WHERE id = 'aecc67c2-a2e4-4251-9485-4a42e7fdfe8d';

-- 2. Delete order_items
DELETE FROM order_items 
WHERE id = 'cbfffac0-0501-4f9d-b436-e707ef9cdd88';

-- 3. Delete order
DELETE FROM orders 
WHERE id = '44f804f8-b765-4355-b979-686cf0330db0';

-- 4. Delete enrollment
DELETE FROM enrollments 
WHERE id = '59a97bb9-a1fe-46d4-b091-23435b6f03b3';
