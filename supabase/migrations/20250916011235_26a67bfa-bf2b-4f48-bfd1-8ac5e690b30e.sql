-- Add admin manage policies to ensure admin can update/delete orders and related data
-- Orders: allow admins to manage all operations
CREATE POLICY IF NOT EXISTS "Admins can manage all orders (all)"
ON public.orders
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Order items: allow admins to manage all operations
CREATE POLICY IF NOT EXISTS "Admins can manage all order items"
ON public.order_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Enrollments: allow admins to manage all operations
CREATE POLICY IF NOT EXISTS "Admins can manage all enrollments"
ON public.enrollments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
