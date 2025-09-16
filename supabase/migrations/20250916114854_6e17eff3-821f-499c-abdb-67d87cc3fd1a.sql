-- Create homepage_sections table for managing main page course sections
CREATE TABLE public.homepage_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  icon_type TEXT NOT NULL DEFAULT 'emoji', -- 'emoji', 'lucide', 'custom'
  icon_value TEXT NOT NULL DEFAULT '📚', -- emoji or icon name
  section_type TEXT NOT NULL DEFAULT 'custom', -- 'featured', 'free', 'premium', 'vod', 'custom'
  filter_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'category', 'tag', 'hot_new'
  filter_value TEXT, -- category name, tag, or null for manual
  display_limit INTEGER NOT NULL DEFAULT 8,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create homepage_section_courses table for manual course selection
CREATE TABLE public.homepage_section_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.homepage_sections(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(section_id, course_id)
);

-- Enable RLS
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_section_courses ENABLE ROW LEVEL SECURITY;

-- Create policies for homepage_sections
CREATE POLICY "Homepage sections are viewable by everyone" 
ON public.homepage_sections 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage homepage sections" 
ON public.homepage_sections 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create policies for homepage_section_courses  
CREATE POLICY "Homepage section courses are viewable by everyone" 
ON public.homepage_section_courses 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage homepage section courses" 
ON public.homepage_section_courses 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX idx_homepage_sections_order ON public.homepage_sections(order_index);
CREATE INDEX idx_homepage_sections_active ON public.homepage_sections(is_active);
CREATE INDEX idx_homepage_section_courses_section ON public.homepage_section_courses(section_id);
CREATE INDEX idx_homepage_section_courses_order ON public.homepage_section_courses(section_id, order_index);

-- Create trigger for updated_at
CREATE TRIGGER update_homepage_sections_updated_at
BEFORE UPDATE ON public.homepage_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default sections to match current homepage
INSERT INTO public.homepage_sections (title, subtitle, icon_type, icon_value, section_type, filter_type, filter_value, order_index) VALUES
('지금 가장 주목받는 강의', null, 'emoji', '🔥', 'featured', 'hot_new', null, 1),
('무료로 배우는 이커머스', null, 'lucide', 'Zap', 'free', 'category', '무료강의', 2),
('프리미엄 강의', null, 'emoji', '👑', 'premium', 'category', '프리미엄 강의', 3),
('VOD 강의', null, 'emoji', '📺', 'vod', 'category', 'VOD 강의', 4);