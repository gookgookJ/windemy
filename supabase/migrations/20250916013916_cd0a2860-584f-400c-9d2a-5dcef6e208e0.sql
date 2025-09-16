-- Create missing orders and order_items for jayce@windly.cc account
WITH user_data AS (
  SELECT id as user_id FROM profiles WHERE email = 'jayce@windly.cc'
),
enrollment_data AS (
  SELECT 
    e.user_id,
    e.course_id,
    e.enrolled_at,
    c.price,
    c.title
  FROM enrollments e
  JOIN courses c ON e.course_id = c.id
  JOIN user_data u ON e.user_id = u.user_id
),
new_orders AS (
  INSERT INTO orders (user_id, total_amount, status, payment_method, created_at)
  SELECT 
    user_id,
    price,
    'completed',
    CASE WHEN price = 0 THEN 'free' ELSE 'card' END,
    enrolled_at
  FROM enrollment_data
  RETURNING id, user_id, created_at
)
INSERT INTO order_items (order_id, course_id, price)
SELECT 
  no.id as order_id,
  ed.course_id,
  ed.price
FROM new_orders no
JOIN enrollment_data ed ON no.user_id = ed.user_id 
  AND ABS(EXTRACT(EPOCH FROM (no.created_at - ed.enrolled_at))) < 1;