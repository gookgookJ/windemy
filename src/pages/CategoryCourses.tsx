import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  duration: string;
  studentCount: number;
  level: "beginner" | "intermediate" | "advanced";
  category: string;
  isHot: boolean;
  isNew: boolean;
  description: string;
}

const CategoryCourses = () => {
  const { category } = useParams<{ category: string }>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const { toast } = useToast();

  const categoryNames: Record<string, string> = {
    "free-courses": "무료강의",
    "vod-courses": "VOD 강의", 
    "premium-courses": "프리미엄 강의"
  };

  const categoryDescriptions: Record<string, string> = {
    "free-courses": "누구나 무료로 수강할 수 있는 고품질 강의들을 만나보세요",
    "vod-courses": "언제 어디서나 자유롭게 학습할 수 있는 주문형 비디오 강의",
    "premium-courses": "전문가의 심화 지식을 담은 프리미엄 회원 전용 강의"
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      fetchCategories();
    }
  }, [courses]);

  useEffect(() => {
    // Set initial category selection based on route
    if (category && categories.length > 0) {
      const routeCategoryMap: Record<string, string> = {
        "free-courses": "7c3b2929-c841-42b0-9047-a7c63abb40fa", // 무료강의 category ID
        "vod-courses": "ce6f2ffc-96bf-4cf0-8f83-27ae2f2fc273", // VOD 강의 category ID  
        "premium-courses": "76496899-53c0-41d7-a716-ee0ebbab6a41" // 프리미엄 강의 category ID
      };
      
      const initialCategory = routeCategoryMap[category] || "all";
      setSelectedCategory(initialCategory);
    }
  }, [category, categories]);

  useEffect(() => {
    filterAndSortCourses();
  }, [courses, searchTerm, filterLevel, selectedCategory, category]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      // Get all courses
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
        thumbnail: course.thumbnail_url || '/lovable-uploads/f33f7261-05f8-42bc-8f5d-73dddc791ac5.png',
        price: course.price,
        originalPrice: null,
        rating: course.rating || 0,
        reviewCount: course.course_reviews?.length || 0,
        duration: `${course.duration_hours}시간`,
        studentCount: course.total_students,
        level: course.level as "beginner" | "intermediate" | "advanced",
        category: course.categories?.name || '기타',
        isHot: course.is_hot || course.total_students > 100,
        isNew: course.is_new || new Date(course.created_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000,
        description: course.short_description || course.description || ""
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

  const filterAndSortCourses = () => {
    let filtered = [...courses];

    // Apply special category logic based on route FIRST
    if (category === "free-courses") {
      filtered = filtered.filter(course => course.price === 0);
    } else if (category === "vod-courses") {
      // Filter by VOD category specifically
      filtered = filtered.filter(course => course.category === "VOD 강의");
    } else if (category === "premium-courses") {
      // Filter by premium courses (paid courses)
      filtered = filtered.filter(course => course.price > 0);
    }

    // Then apply additional category filter from sidebar (only if not "all")
    if (selectedCategory !== "all") {
      const categoryObj = categories.find(cat => cat.id === selectedCategory);
      if (categoryObj) {
        filtered = filtered.filter(course => course.category === categoryObj.name);
      }
    }

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

    setFilteredCourses(filtered);
  };

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

  const currentCategoryName = categoryNames[category || ""] || "강의";
  const currentCategoryDescription = categoryDescriptions[category || ""] || "";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">{currentCategoryName}</h1>
          <p className="text-muted-foreground">{currentCategoryDescription}</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">카테고리</h3>
              <div className="space-y-2">
                {categories.map((categoryItem) => (
                  <button
                    key={categoryItem.id}
                    onClick={() => setSelectedCategory(categoryItem.id)}
                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                      selectedCategory === categoryItem.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{categoryItem.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {categoryItem.count}
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
            {filteredCourses.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold mb-2">등록된 강의가 없습니다</h3>
                <p className="text-muted-foreground">곧 새로운 강의가 업데이트될 예정입니다.</p>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} {...course} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryCourses;