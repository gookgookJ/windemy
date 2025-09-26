-- Delete the '전체' category as it's not a real course category, just a UI filter
DELETE FROM categories WHERE name = '전체';