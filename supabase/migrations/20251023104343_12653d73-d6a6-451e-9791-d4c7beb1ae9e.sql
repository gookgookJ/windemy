-- Create table to store best blog posts
CREATE TABLE IF NOT EXISTS public.best_blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  url text NOT NULL,
  order_index integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.best_blog_posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anyone can view blog posts)
CREATE POLICY "Anyone can view best blog posts"
ON public.best_blog_posts
FOR SELECT
USING (true);

-- Only system can manage blog posts
CREATE POLICY "System can manage best blog posts"
ON public.best_blog_posts
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_best_blog_posts_order ON public.best_blog_posts(order_index);

-- Insert current blog posts as initial data
INSERT INTO public.best_blog_posts (title, url, order_index) VALUES
  ('타오바오 배송의 모든 것 (배송조회, 환불, 판매자 문의)', 'https://windly.cc/blog/taobao-shipping-refund-guide', 1),
  ('무신사, 10조 기업가치 향한 전력투구', 'https://windly.cc/blog/musinsa-10trillion-strategy', 2),
  ('조조타운 입점의 모든 것 (무신사/대행사 없이 입점하는 방법)', 'https://windly.cc/blog/zozotown-onboarding-guide', 3),
  ('1688 할인받아 구매하는 방법', 'https://windly.cc/blog/1688-discount-guide', 4),
  ('''이제 결제까지?'' ChatGPT의 진화', 'https://windly.cc/blog/commerce-chatgpt', 5)
ON CONFLICT DO NOTHING;