import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Zap, Heart } from "lucide-react";
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

interface Category {
  id: string;
  name: string;
  course_count: number;
}

const FeaturedCourses = () => {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [freeCourses, setFreeCourses] = useState<Course[]>([]);
  const [premiumCourses, setPremiumCourses] = useState<Course[]>([]);
  const [vodCourses, setVodCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoursesData();
  }, []);

  const fetchCoursesData = async () => {
    try {
      setLoading(true);

      // Fetch all published courses with instructor and category data
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          profiles:instructor_id(full_name),
          categories:category_id(name, slug)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        throw coursesError;
      }

      // Fetch categories for the category section
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        throw categoriesError;
      }

      // Process courses data with better handling
      const processedCourses = coursesData?.map(course => ({
        ...course,
        instructor_name: course.profiles?.full_name || (course.instructor_id ? '강사' : '운영진'),
        category: course.categories?.name || '기타',
        // Prefer uploaded storage path when direct URL is missing
        thumbnail_url: course.thumbnail_url || course.thumbnail_path || course.detail_image_path || '/placeholder.svg'
      })) || [];

      console.log('Processed courses:', processedCourses);

      // Get featured courses - if none are marked as hot/new, get the latest ones
      let featured = processedCourses.filter(course => course.is_hot || course.is_new);
      if (featured.length === 0) {
        featured = processedCourses.slice(0, 8);
      } else {
        featured = featured.slice(0, 8);
      }

      setFeaturedCourses(featured);

      // Categorize courses by category name
      const free = processedCourses.filter(course => 
        course.category === '무료강의'
      ).slice(0, 6);

      const premium = processedCourses.filter(course => 
        course.category === '프리미엄 강의'
      ).slice(0, 6);

      const vod = processedCourses.filter(course => 
        course.category === 'VOD 강의'
      ).slice(0, 6);

      setFreeCourses(free);
      setPremiumCourses(premium);
      setVodCourses(vod);

      // Process categories with course counts
      const processedCategories = categoriesData?.map(category => ({
        ...category,
        course_count: processedCourses.filter(course => course.category === category.name).length
      })) || [];

      setCategories(processedCategories);

      console.log('Categories with counts:', processedCategories);
      console.log('Free courses:', free);
      console.log('Premium courses:', premium);
      console.log('VOD courses:', vod);

    } catch (error) {
      console.error('Error fetching courses data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CourseCarousel = ({ courses, title, viewAllLink, icon }: { 
    courses: Course[], 
    title: string, 
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
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              {title}
            </h2>
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
        
        {/* Featured Courses Section */}
        {featuredCourses.length > 0 && (
          <CourseCarousel 
            courses={featuredCourses}
            title="지금 가장 주목받는 강의"
            viewAllLink="/courses"
            icon={<span className="text-2xl">🔥</span>}
          />
        )}

        {/* Free Courses Section */}
        {freeCourses.length > 0 && (
          <CourseCarousel 
            courses={freeCourses}
            title="무료로 배우는 이커머스"
            viewAllLink="/courses/free-courses"
            icon={<Zap className="w-7 h-7 text-blue-500" />}
          />
        )}

        {/* Premium Courses Section */}
        {premiumCourses.length > 0 && (
          <CourseCarousel 
            courses={premiumCourses}
            title="프리미엄 강의"
            viewAllLink="/courses/premium-courses"
            icon={<span className="text-2xl">👑</span>}
          />
        )}

        {/* VOD Courses Section */}
        {vodCourses.length > 0 && (
          <CourseCarousel 
            courses={vodCourses}
            title="VOD 강의"
            viewAllLink="/courses/vod-courses"
            icon={<span className="text-2xl">📺</span>}
          />
        )}
      </div>
    </section>
  );
};

export default FeaturedCourses;