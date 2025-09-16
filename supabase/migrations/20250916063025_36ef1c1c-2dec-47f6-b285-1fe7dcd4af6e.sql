-- Create storage bucket for hero images
INSERT INTO storage.buckets (id, name, public) VALUES ('hero-images', 'hero-images', true);

-- Create hero_slides table
CREATE TABLE public.hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  background_color TEXT DEFAULT 'from-blue-400 to-blue-600',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Hero slides are viewable by everyone" 
ON public.hero_slides 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all hero slides" 
ON public.hero_slides 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- Create storage policies for hero images
CREATE POLICY "Hero images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'hero-images');

CREATE POLICY "Admins can upload hero images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'hero-images' AND EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

CREATE POLICY "Admins can update hero images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'hero-images' AND EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

CREATE POLICY "Admins can delete hero images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'hero-images' AND EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- Create trigger for updated_at
CREATE TRIGGER update_hero_slides_updated_at
BEFORE UPDATE ON public.hero_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data
INSERT INTO public.hero_slides (title, subtitle, description, image_url, order_index, background_color) VALUES
('실시간 강의 50개 완전 무료', '지금 가장 주목받는 강의', '실시간 줌코딩 50개 강의 무료 >', '/hero-slide-1.jpg', 1, 'from-pink-400 to-red-400'),
('신혼부부가 1억으로', '서울에서 내집마련하는 법', '실시간 줌코딩 50개 강의 무료 >', '/hero-slide-2.jpg', 2, 'from-pink-300 to-pink-500'),
('집 사기 전 꼭 알아야 할 A to Z', '나나쌤의 내집마련 기초편', '추천인이 내집마련하는 법 알려드립니다 →', '/hero-slide-3.jpg', 3, 'from-green-400 to-blue-500');