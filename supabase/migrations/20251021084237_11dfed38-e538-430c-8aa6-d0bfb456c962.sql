-- Delete order items for the course "공동구매 중개의 정석" for user jayce@windly.cc
DELETE FROM order_items 
WHERE id = 'bcbe0ba4-89b6-4355-8e66-6f850210c8f0';

-- Delete the order
DELETE FROM orders 
WHERE id = 'e2299997-145c-48f4-b8a0-a2a6599bc3dc';