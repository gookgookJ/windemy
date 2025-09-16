import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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

      // Fetch all published courses with instructor data
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          profiles:instructor_id(full_name)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Fetch categories with course counts
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Process courses data
      const processedCourses = coursesData?.map(course => ({
        ...course,
        instructor_name: course.profiles?.full_name || '강사',
        category: course.category_id ? categoriesData?.find(cat => cat.id === course.category_id)?.name : '기타'
      })) || [];

      // Get featured courses (hot or new courses, limited to 8)
      const featured = processedCourses
        .filter(course => course.is_hot || course.is_new)
        .slice(0, 8);

      setFeaturedCourses(featured);

      // Categorize courses by type
      const free = processedCourses.filter(course => 
        course.category === '무료강의' || course.price === 0
      ).slice(0, 3);

      const premium = processedCourses.filter(course => 
        course.category === '프리미엄 강의'
      ).slice(0, 3);

      const vod = processedCourses.filter(course => 
        course.category === 'VOD 강의'
      ).slice(0, 3);

      setFreeCourses(free);
      setPremiumCourses(premium);
      setVodCourses(vod);

      // Process categories with course counts
      const processedCategories = categoriesData?.map(category => ({
        ...category,
        course_count: processedCourses.filter(course => course.category === category.name).length
      })) || [];

      setCategories(processedCategories);

    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const CourseGrid = ({ courses, title, viewAllLink }: { 
    courses: Course[], 
    title: string, 
    viewAllLink: string 
  }) => (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
          {title}
        </h2>
        <Link 
          to={viewAllLink}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          더보기 →
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course, index) => (
          <Link key={course.id} to={`/course/${course.id}`} className="group cursor-pointer">
            <div className="relative mb-4">
              <img
                src={course.thumbnail_url || '/placeholder.svg'}
                alt={course.title}
                className="w-full h-48 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
              />
              {course.is_hot && (
                <div className="absolute top-3 right-3">
                  <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                    HOT
                  </span>
                </div>
              )}
              {course.is_new && (
                <div className="absolute top-3 right-3">
                  <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                    NEW
                  </span>
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span className="bg-white text-foreground text-sm font-bold px-2 py-1 rounded shadow-md">
                  {index + 1}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-bold text-foreground line-clamp-2 leading-tight">
                {course.title}
              </h3>
              
              <div className="text-sm text-muted-foreground">
                {course.instructor_name}
              </div>

              {course.rating && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-yellow-500">★</span>
                  <span className="font-semibold">{course.rating}</span>
                  <span className="text-muted-foreground">
                    ({course.total_students?.toLocaleString() || 0}명)
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-foreground">
                  {course.price === 0 ? '무료' : `₩${course.price.toLocaleString()}`}
                </div>
                {course.duration_hours && (
                  <div className="text-sm text-muted-foreground">
                    {course.duration_hours}시간
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

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
          <CourseGrid 
            courses={featuredCourses}
            title="지금 가장 주목받는 강의"
            viewAllLink="/courses"
          />
        )}

        {/* Free Courses Section */}
        {freeCourses.length > 0 && (
          <CourseGrid 
            courses={freeCourses}
            title="🆓 무료로 배우는 아카데미"
            viewAllLink="/courses/free-courses"
          />
        )}

        {/* Premium Courses Section */}
        {premiumCourses.length > 0 && (
          <CourseGrid 
            courses={premiumCourses}
            title="👑 프리미엄 강의"
            viewAllLink="/courses/premium-courses"
          />
        )}

        {/* VOD Courses Section */}
        {vodCourses.length > 0 && (
          <CourseGrid 
            courses={vodCourses}
            title="📺 VOD 강의"
            viewAllLink="/courses/vod-courses"
          />
        )}

        {/* Categories Overview */}
        {categories.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-8">
              카테고리별 강의
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Link 
                  key={category.id} 
                  to={`/courses?category=${category.name}`}
                  className="group"
                >
                  <div className="bg-card border rounded-xl p-6 hover:shadow-lg transition-shadow duration-200 group-hover:scale-105">
                    <h3 className="font-bold text-foreground mb-2">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {category.course_count}개의 강의
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCourses;