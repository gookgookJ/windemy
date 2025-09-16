-- Insert missing order_items for existing orders based on enrollments
INSERT INTO order_items (order_id, course_id, price)
SELECT DISTINCT 
  o.id as order_id,
  e.course_id,
  COALESCE(c.price, 0) as price
FROM orders o
JOIN enrollments e ON o.user_id = e.user_id 
  AND ABS(EXTRACT(EPOCH FROM (o.created_at - e.enrolled_at))) < 60  -- enrolled within 60 seconds of order
JOIN courses c ON e.course_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id AND e.course_id = oi.course_id
WHERE oi.id IS NULL  -- Only insert if order_item doesn't already exist
  AND o.status = 'completed';