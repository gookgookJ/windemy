import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Zap, Heart, Crown, Monitor, BookOpen, Target } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";

interface Course {
  id: string;
  title: string;
  instructor_name?: string;
  instructor_id?: string;
  thumbnail_url?: string;
  price: number;
  rating?: number;
  total_students?: number;
  duration_hours?: number;
  level?: string;
  category?: string;
  is_hot?: boolean;
  is_new?: boolean;
  short_description?: string;
}

interface HomepageSection {
  id: string;
  title: string;
  subtitle?: string;
  icon_type: 'emoji' | 'lucide' | 'custom';
  icon_value: string;
  filter_type: 'manual' | 'category' | 'tag' | 'hot_new';
  filter_value?: string;
  display_limit: number;
  order_index: number;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  course_count: number;
}

const FeaturedCourses = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [sectionCourses, setSectionCourses] = useState<Record<string, Course[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomepageSections();
  }, []);

  const fetchHomepageSections = async () => {
    try {
      setLoading(true);

      // Fetch homepage sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('homepage_sections')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      setSections((sectionsData || []).map(section => ({
        ...section,
        icon_type: section.icon_type as 'emoji' | 'lucide' | 'custom',
        filter_type: section.filter_type as 'manual' | 'category' | 'tag' | 'hot_new'
      })));

      // Fetch courses for each section
      const coursesData: Record<string, Course[]> = {};

      for (const section of (sectionsData || [])) {
        let courses: Course[] = [];

        if (section.filter_type === 'manual') {
          // Fetch manually selected courses
          const { data: manualCourses } = await supabase
            .from('homepage_section_courses')
            .select(`
              order_index,
              courses:course_id(
                *,
                profiles:instructor_id(full_name),
                categories:category_id(name)
              )
            `)
            .eq('section_id', section.id)
            .order('order_index');

          courses = (manualCourses || [])
            .map((mc: any) => ({
              ...mc.courses,
              instructor_name: mc.courses?.profiles?.full_name || '운영진',
              category: mc.courses?.categories?.name || '기타',
              thumbnail_url: mc.courses?.thumbnail_url || mc.courses?.thumbnail_path || '/placeholder.svg'
            }))
            .slice(0, section.display_limit);

        } else if (section.filter_type === 'category' && section.filter_value) {
          // Fetch courses by category
          const { data: categoryCourses } = await supabase
            .from('courses')
            .select(`
              *,
              profiles:instructor_id(full_name),
              categories:category_id(name)
            `)
            .eq('is_published', true)
            .eq('categories.name', section.filter_value)
            .order('created_at', { ascending: false })
            .limit(section.display_limit);

          courses = (categoryCourses || []).map(course => ({
            ...course,
            instructor_name: course.profiles?.full_name || '운영진',
            category: course.categories?.name || '기타',
            thumbnail_url: course.thumbnail_url || course.thumbnail_path || '/placeholder.svg'
          }));

        } else if (section.filter_type === 'hot_new') {
          // Fetch hot/new courses
          const { data: hotNewCourses } = await supabase
            .from('courses')
            .select(`
              *,
              profiles:instructor_id(full_name),
              categories:category_id(name)
            `)
            .eq('is_published', true)
            .or('is_hot.eq.true,is_new.eq.true')
            .order('created_at', { ascending: false })
            .limit(section.display_limit);

          courses = (hotNewCourses || []).map(course => ({
            ...course,
            instructor_name: course.profiles?.full_name || '운영진',
            category: course.categories?.name || '기타',
            thumbnail_url: course.thumbnail_url || course.thumbnail_path || '/placeholder.svg'
          }));
        }

        coursesData[section.id] = courses;
      }

      setSectionCourses(coursesData);

    } catch (error) {
      console.error('Error fetching homepage sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const CourseCarousel = ({ courses, title, subtitle, viewAllLink, icon }: { 
    courses: Course[], 
    title: string, 
    subtitle?: string,
    viewAllLink: string,
    icon?: React.ReactNode
  }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ 
      align: 'start',
      slidesToScroll: 1,
      loop: false
    });

    const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
    const scrollNext = () => emblaApi && emblaApi.scrollNext();

    // Show only first 4 courses initially, rest in carousel
    const displayCourses = courses.slice(0, Math.min(courses.length, 8));

    return (
      <div className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                {title}
              </h2>
              {subtitle && (
                <p className="text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {courses.length > 4 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollPrev}
                  className="h-10 w-10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollNext}
                  className="h-10 w-10"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Link 
              to={viewAllLink}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              더보기 →
            </Link>
          </div>
        </div>

        {courses.length <= 4 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {displayCourses.map((course, index) => (
                <div key={course.id} className="flex-none w-[calc(25%-18px)]">
                  <CourseCard course={course} index={index} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getIconComponent = (section: HomepageSection) => {
    if (section.icon_type === 'emoji') {
      return <span className="text-2xl">{section.icon_value}</span>;
    } else if (section.icon_type === 'lucide') {
      const iconMap: Record<string, React.ComponentType<any>> = {
        Zap,
        Crown,
        Monitor,
        BookOpen,
        Target
      };
      const IconComponent = iconMap[section.icon_value] || BookOpen;
      return <IconComponent className="w-7 h-7 text-blue-500" />;
    }
    return <span className="text-2xl">📚</span>;
  };

  const CourseCard = ({ course, index }: { course: Course, index: number }) => {
    const { toggleFavorite, isFavorite } = useFavorites();

    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(course.id);
    };

    return (
      <Link to={`/course/${course.id}`} className="group cursor-pointer block">
        <div className="relative mb-4">
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-[159px] object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
            style={{ aspectRatio: "283/159" }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
            }}
          />
          
          {/* Favorite Heart Button */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110 z-10"
            aria-label={isFavorite(course.id) ? "관심 강의에서 제거" : "관심 강의에 추가"}
          >
            <Heart 
              className={`w-4 h-4 transition-all duration-200 ${
                isFavorite(course.id) 
                  ? 'text-red-500 fill-red-500' 
                  : 'text-gray-400 hover:text-red-400'
              }`}
            />
          </button>

          {/* Tags */}
          <div className="absolute top-3 left-3 flex gap-1">
            {course.is_hot && (
              <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                HOT
              </span>
            )}
            {course.is_new && (
              <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                NEW
              </span>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          
          {course.instructor_name && 
           course.instructor_name !== "운영진" && 
           course.instructor_name !== "강사" && (
            <div className="text-sm text-muted-foreground">
              {course.instructor_name}
            </div>
          )}
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-48 bg-muted rounded-xl"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {sections.map((section) => {
          const courses = sectionCourses[section.id] || [];
          if (courses.length === 0) return null;

          return (
            <CourseCarousel 
              key={section.id}
              courses={courses}
              title={section.title}
              subtitle={section.subtitle}
              viewAllLink="/courses"
              icon={getIconComponent(section)}
            />
          );
        })}

        {/* Fallback message if no sections are available */}
        {sections.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">강의 섹션이 없습니다</h3>
            <p className="text-muted-foreground">
              관리자 페이지에서 메인 페이지 섹션을 설정해주세요.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCourses;