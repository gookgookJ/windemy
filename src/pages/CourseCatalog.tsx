import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CourseCatalog = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      fetchCategories();
    }
  }, [courses]);

  // Set initial category selection for main courses page
  useEffect(() => {
    setSelectedCategory("all");
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          profiles:instructor_id(full_name),
          categories:category_id(name),
          course_reviews(rating)
        `)
        .eq('is_published', true);

      if (error) throw error;

      const coursesWithStats = data.map(course => ({
        id: course.id,
        title: course.title,
        instructor: course.profiles?.full_name || 'Unknown',
        thumbnail: course.thumbnail_path || course.thumbnail_url || '/lovable-uploads/f33f7261-05f8-42bc-8f5d-73dddc791ac5.png',
        price: course.price,
        originalPrice: null, // You can add this to course_options if needed
        rating: course.rating || 0,
        reviewCount: course.course_reviews?.length || 0,
        duration: `${course.duration_hours}시간`,
        studentCount: course.total_students,
        level: course.level as "beginner" | "intermediate" | "advanced",
        category: course.categories?.name || '기타',
        isHot: course.is_hot || course.total_students > 1000,
        isNew: course.is_new || new Date(course.created_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000, // 30일 이내
      }));

      setCourses(coursesWithStats);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "데이터 로딩 실패",
        description: "강의 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          courses!category_id(id)
        `);

      if (error) throw error;

      // Wait for courses to be loaded before calculating counts
      const allCoursesCount = courses.length;
      
      const categoriesWithCounts = [
        { id: "all", name: "전체", count: allCoursesCount },
        ...data.map(cat => ({
          id: cat.id,
          name: cat.name,
          count: cat.courses?.length || 0
        }))
      ];

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredCourses = (() => {
    let filtered = selectedCategory === "all" 
      ? courses 
      : courses.filter(course => {
          const category = categories.find(cat => cat.id === selectedCategory);
          return category && course.category === category.name;
        });

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Level filter
    if (filterLevel !== "all") {
      filtered = filtered.filter(course => course.level === filterLevel);
    }

    return filtered;
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">강의 목록을 불러오는 중...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">전체 강의</h1>
          <p className="text-muted-foreground">전문가들의 실무 경험이 담긴 고품질 강의를 만나보세요</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">카테고리</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                      selectedCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{category.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {category.count}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="강의 제목으로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="난이도" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="beginner">초급</SelectItem>
                  <SelectItem value="intermediate">중급</SelectItem>
                  <SelectItem value="advanced">고급</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Course Grid */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} {...course} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CourseCatalog;