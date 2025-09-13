import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Filter, Search, Grid, List, Star, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [filterLevel, setFilterLevel] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
    if (category) {
      fetchCourses();
    }
  }, [category]);

  useEffect(() => {
    filterAndSortCourses();
  }, [courses, searchTerm, sortBy, filterLevel]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      // Get category info
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', category)
        .single();

      if (categoryError) throw categoryError;

      // Get courses for this category
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          profiles:instructor_id(full_name),
          categories:category_id(name),
          course_reviews(rating)
        `)
        .eq('is_published', true)
        .eq('category_id', categoryData.id);

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
        isHot: course.total_students > 100,
        isNew: new Date(course.created_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000,
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

  const filterAndSortCourses = () => {
    let filtered = [...courses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Level filter
    if (filterLevel !== "all") {
      filtered = filtered.filter(course => course.level === filterLevel);
    }

    // Sort
    switch (sortBy) {
      case "latest":
        filtered.sort((a, b) => new Date(b.isNew ? 1 : 0).getTime() - new Date(a.isNew ? 1 : 0).getTime());
        break;
      case "popular":
        filtered.sort((a, b) => b.studentCount - a.studentCount);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
    }

    setFilteredCourses(filtered);
  };

  const renderCourseCard = (course: Course) => (
    <Card key={course.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <img 
            src={course.thumbnail} 
            alt={course.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            {course.isNew && <Badge className="bg-primary/90 text-primary-foreground">NEW</Badge>}
            {course.isHot && <Badge variant="destructive">HOT</Badge>}
            {course.price === 0 && <Badge className="bg-green-500 text-white">무료</Badge>}
          </div>
          <div className="absolute top-3 right-3">
            <Button size="sm" variant="ghost" className="bg-white/80 hover:bg-white">
              ♡
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
              <Link to={`/course/${course.id}`}>
                {course.title}
              </Link>
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {course.description}
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{course.rating.toFixed(1)}</span>
              <span>({course.reviewCount})</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{course.studentCount}명</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                {course.price === 0 ? (
                  <span className="text-xl font-bold text-green-600">무료</span>
                ) : (
                  <>
                    <span className="text-xl font-bold text-foreground">
                      {course.price.toLocaleString()}원
                    </span>
                    {course.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {course.originalPrice.toLocaleString()}원
                      </span>
                    )}
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{course.instructor}</p>
            </div>

            <div className="text-right space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{course.duration}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {course.level === "beginner" ? "초급" : 
                 course.level === "intermediate" ? "중급" : "고급"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">{currentCategoryName}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {currentCategoryDescription}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>총 {filteredCourses.length}개의 강의</span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex flex-wrap gap-4 flex-1">
              <div className="relative min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="강의 제목이나 강사명으로 검색"
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

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">최신순</SelectItem>
                  <SelectItem value="popular">인기순</SelectItem>
                  <SelectItem value="rating">평점순</SelectItem>
                  <SelectItem value="price-low">가격 낮은순</SelectItem>
                  <SelectItem value="price-high">가격 높은순</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </div>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">등록된 강의가 없습니다</h3>
            <p className="text-muted-foreground">곧 새로운 강의가 업데이트될 예정입니다.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center sm:justify-items-stretch">
            {filteredCourses.map(renderCourseCard)}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CategoryCourses;