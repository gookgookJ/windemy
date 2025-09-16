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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {courses.map((course, index) => (
          <Link key={course.id} to={`/course/${course.id}`} className="group cursor-pointer">
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
            </div>
            
            <div className="space-y-3">
              <h3 className="font-bold text-foreground line-clamp-2 leading-tight">
                {course.title}
              </h3>
              
              {course.instructor_name && 
               course.instructor_name !== "운영진" && 
               course.instructor_name !== "강사" && (
                <div className="text-sm text-muted-foreground">
                  {course.instructor_name}
                </div>
              )}

              {(Number(course.rating) > 0 && Number(course.total_students) > 0) ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-yellow-500">★</span>
                  <span className="font-semibold">{course.rating}</span>
                  <span className="text-muted-foreground">
                    ({Number(course.total_students).toLocaleString()}명)
                  </span>
                </div>
              ) : null}

              {course.price > 0 && (
                <div className="text-lg font-bold text-foreground">
                  ₩{course.price.toLocaleString()}
                </div>
              )}
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