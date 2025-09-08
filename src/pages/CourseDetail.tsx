import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Play, 
  Clock, 
  Users, 
  Star, 
  BookOpen, 
  Award, 
  Download, 
  Share2,
  Heart,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import courseDetailLong from "@/assets/course-detail-long.jpg";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CourseOption {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  benefits: string[];
}

interface CourseSession {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  duration_minutes: number;
  is_preview: boolean;
}

interface CourseReview {
  id: string;
  user_id: string;
  rating: number;
  review_text?: string;
  created_at: string;
  profiles?: {
    full_name?: string;
  };
}

interface Course {
  id: string;
  title: string;
  description?: string;
  short_description?: string;
  price: number;
  instructor_id: string;
  category_id: string;
  level: string;
  duration_hours: number;
  rating: number;
  total_students: number;
  is_published: boolean;
  what_you_will_learn?: string[];
  requirements?: string[];
  thumbnail_path?: string;
  detail_image_path?: string;
  profiles?: {
    full_name?: string;
  };
  categories?: {
    name: string;
  };
}

const CourseDetail = () => {
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [course, setCourse] = useState<Course | null>(null);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [courseSessions, setCourseSessions] = useState<CourseSession[]>([]);
  const [courseReviews, setCourseReviews] = useState<CourseReview[]>([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  useEffect(() => {
    if (user && courseId) {
      checkEnrollment();
    }
  }, [user, courseId]);

  const fetchCourseData = async () => {
    if (!courseId) return;
    
    setLoading(true);
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          profiles:instructor_id(full_name),
          categories:category_id(name)
        `)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch course options
      const { data: optionsData, error: optionsError } = await supabase
        .from('course_options')
        .select('*')
        .eq('course_id', courseId)
        .order('price');

      if (optionsError) throw optionsError;
      setCourseOptions(optionsData || []);
      
      // Set first option as default
      if (optionsData && optionsData.length > 0) {
        setSelectedOption(optionsData[0].id);
      }

      // Fetch course sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('course_sessions')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (sessionsError) throw sessionsError;
      setCourseSessions(sessionsData || []);

      // Fetch course reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('course_reviews')
        .select(`
          *,
          profiles:user_id(full_name)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsError) throw reviewsError;
      setCourseReviews(reviewsData || []);

    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: "데이터 로딩 실패",
        description: "강의 정보를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    if (!user || !courseId) return;
    
    try {
      const { data } = await supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .single();
        
      setIsEnrolled(!!data);
    } catch (error) {
      setIsEnrolled(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!courseId) return;
    
    setEnrolling(true);
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          progress: 0
        });
        
      if (error) throw error;
      
      setIsEnrolled(true);
      toast({
        title: "수강 등록 완료",
        description: "강의 학습을 시작하세요!",
      });
      
      // 바로 학습 페이지로 이동
      navigate(`/learn/${courseId}`);
    } catch (error) {
      console.error('Error enrolling:', error);
      toast({
        title: "등록 실패",
        description: "수강 등록 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setEnrolling(false);
    }
  };

  const selectedCourse = courseOptions.find(option => option.id === selectedOption);
  const discountRate = selectedCourse && selectedCourse.original_price
    ? Math.round(((selectedCourse.original_price - selectedCourse.price) / selectedCourse.original_price) * 100)
    : 0;

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Group sessions by sections for display
  const groupedSessions = courseSessions.reduce((groups: any[], session, index) => {
    const groupIndex = Math.floor(index / 4); // Group every 4 sessions
    if (!groups[groupIndex]) {
      groups[groupIndex] = {
        title: `섹션 ${groupIndex + 1}`,
        duration: 0,
        lessonCount: 0,
        lessons: []
      };
    }
    
    groups[groupIndex].lessons.push({
      title: session.title,
      duration: `${session.duration_minutes}분`,
      isPreview: session.is_preview
    });
    groups[groupIndex].duration += session.duration_minutes;
    groups[groupIndex].lessonCount += 1;
    
    return groups;
  }, []);

  // Convert duration to hours and minutes
  groupedSessions.forEach(group => {
    const hours = Math.floor(group.duration / 60);
    const minutes = group.duration % 60;
    group.duration = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">강의 정보를 불러오는 중...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">강의를 찾을 수 없습니다</h1>
            <p className="text-muted-foreground mb-4">요청하신 강의가 존재하지 않거나 삭제되었습니다.</p>
            <Button onClick={() => navigate('/courses')}>
              강의 목록으로 돌아가기
            </Button>
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
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 text-sm mb-6">
          <span className="text-primary font-medium">{course.categories?.name || "카테고리"}</span>
          <span className="text-muted-foreground">{">"}</span>
          <span className="text-muted-foreground">{course.level}</span>
        </div>

        {/* Desktop Layout: 2-column structure with fixed widths */}
        <div className="hidden lg:flex gap-8 justify-center">
          {/* Left Column: Video and Content - Fixed 757px width */}
          <div className="w-[757px] flex-shrink-0">
            {/* Thumbnail Section - Desktop: 757x426, Mobile: responsive */}
            <div className="relative rounded-xl overflow-hidden shadow-lg mb-6">
              <img
                src={course.thumbnail_path || '/lovable-uploads/f33f7261-05f8-42bc-8f5d-73dddc791ac5.png'}
                alt={course.title}
                className="w-[757px] h-[426px] object-cover"
              />
            </div>

            {/* Sticky Navigation Bar - Full width 4-column layout */}
            <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm mb-8">
              <div className="w-[757px] grid grid-cols-4 gap-0 py-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => scrollToSection('overview')}
                  className="rounded-none border-r border-border first:rounded-l-md last:rounded-r-md last:border-r-0 flex-1 justify-center"
                >
                  소개
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => scrollToSection('curriculum')}
                  className="rounded-none border-r border-border first:rounded-l-md last:rounded-r-md last:border-r-0 flex-1 justify-center"
                >
                  커리큘럼
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => scrollToSection('instructor')}
                  className="rounded-none border-r border-border first:rounded-l-md last:rounded-r-md last:border-r-0 flex-1 justify-center"
                >
                  크리에이터
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => scrollToSection('reviews')}
                  className="rounded-none border-r border-border first:rounded-l-md last:rounded-r-md last:border-r-0 flex-1 justify-center"
                >
                  후기 {courseReviews.length}
                </Button>
              </div>
            </div>

            {/* Main Content Area - 757px width */}
            <div className="w-[757px] space-y-8">
              {/* Long Course Detail Image */}
              <div id="overview" className="w-[757px]">
                <img
                  src={course.detail_image_path || courseDetailLong}
                  alt="강의 상세 내용"
                  className="w-[757px] h-auto rounded-xl shadow-lg"
                />
              </div>

              {/* Course Content Sections */}
              <div className="space-y-12">
                {/* What You'll Learn */}
                <section className="bg-muted/30 rounded-2xl p-8">
                  <h2 className="text-2xl font-bold mb-6">이 강의에서 배우는 것들</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {(course.what_you_will_learn || []).map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                        <span className="text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Curriculum */}
                <section id="curriculum">
                  <h2 className="text-2xl font-bold mb-6">커리큘럼</h2>
                  <div className="space-y-4">
                    {groupedSessions.map((section, sectionIndex) => (
                      <Card key={sectionIndex}>
                        <CardContent className="p-0">
                          <div 
                            className="flex items-center justify-between p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setExpandedSection(expandedSection === sectionIndex ? null : sectionIndex)}
                          >
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{section.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {section.duration}
                                </span>
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-4 h-4" />
                                  {section.lessonCount}개 강의
                                </span>
                              </div>
                            </div>
                            {expandedSection === sectionIndex ? (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          
                          {expandedSection === sectionIndex && (
                            <div className="border-t border-border">
                              {section.lessons.map((lesson: any, lessonIndex: number) => (
                                <div key={lessonIndex} className="flex items-center justify-between p-4 border-b border-border last:border-b-0">
                                  <div className="flex items-center gap-3">
                                    <Play className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">{lesson.title}</span>
                                    {lesson.isPreview && (
                                      <Badge variant="outline" className="text-xs">미리보기</Badge>
                                    )}
                                  </div>
                                  <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>

                {/* Instructor */}
                <section id="instructor" className="bg-muted/30 rounded-2xl p-8">
                  <h2 className="text-2xl font-bold mb-6">강사 소개</h2>
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{course.profiles?.full_name || "강사"}</h3>
                      <p className="text-muted-foreground mb-4">{course.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{course.total_students.toLocaleString()}명의 수강생</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span>{course.rating}점 평점</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Reviews */}
                <section id="reviews">
                  <h2 className="text-2xl font-bold mb-6">수강생 후기</h2>
                  <div className="space-y-6">
                    {courseReviews.map((review, index) => (
                      <Card key={index}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              <User className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-medium">{review.profiles?.full_name || "익명"}</span>
                                <div className="flex items-center">
                                  {[...Array(review.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                                  ))}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-muted-foreground">{review.review_text}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* Right Column: Fixed Purchase Card - Desktop Only */}
          <div className="hidden lg:block w-[383px] flex-shrink-0">
            <div className="sticky top-24">
              <Card className="shadow-lg border border-border/50 p-6">
                <div className="space-y-6">
                  {/* Course Title */}
                  <h1 className="text-xl font-bold leading-tight">
                    {course.title}
                  </h1>

                  {/* Rating and Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < Math.floor(course.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{course.rating}</span>
                      <span className="text-sm text-muted-foreground">({courseReviews.length}개 후기)</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {discountRate}% 할인가 {(selectedCourse?.original_price ?? 0).toLocaleString()}원
                    </div>
                  </div>

                  {/* Course Price */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-primary">
                        {(selectedCourse?.price ?? 0).toLocaleString()}원
                      </span>
                      <Badge variant="destructive" className="text-sm">
                        2차 얼리버드
                      </Badge>
                    </div>
                  </div>

                  {/* Course Benefits */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">포함 혜택</h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">💰 수료 후 매출 천만원 보장</div>
                      <div className="flex items-start gap-2 text-sm">🎁 신청만 해도 300만원 상당 혜택 제공</div>
                      <div className="flex items-start gap-2 text-sm">💪 1:1로 케어하는 스파르타 학습 시스템</div>
                      <div className="flex items-start gap-2 text-sm">📱 핸드폰 하나로 완전 자동화 시스템</div>
                      <div className="flex items-start gap-2 text-sm">⚡ 하루 3시간 투자로 월 천만원 수익 보장</div>
                      <div className="flex items-start gap-2 text-sm">🔒 평생 A/S 및 업데이트 지원</div>
                    </div>
                  </div>

                  {/* Course Options Selection */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">강의 구성</h3>
                    <div className="space-y-2">
                      {courseOptions.map((option) => (
                        <div 
                          key={option.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedOption === option.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedOption(option.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{option.name}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary">
                                {option.price.toLocaleString()}원
                              </div>
                              {option.original_price && (
                                <div className="text-xs text-muted-foreground line-through">
                                  {option.original_price.toLocaleString()}원
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Final Price */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">상품 금액</span>
                      <span className="text-2xl font-bold text-primary">
                        {(selectedCourse?.price ?? 0).toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        onClick={() => setIsWishlisted(!isWishlisted)}
                      >
                        <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current text-red-500' : 'text-muted-foreground'}`} />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {course.total_students.toLocaleString()}
                      </span>
                    </div>
                    
                    {isEnrolled ? (
                      <Button 
                        variant="default" 
                        size="lg" 
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => navigate(`/learn/${courseId}`)}
                      >
                        강의 구매하기
                      </Button>
                    ) : (
                      <Button 
                        variant="default" 
                        size="lg" 
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={handleEnroll}
                        disabled={enrolling}
                      >
                        {enrolling ? "등록 중..." : "강의 구매하기"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden">
          {/* Mobile Thumbnail */}
          <div className="relative rounded-xl overflow-hidden shadow-lg mb-6">
            <img
              src={course.thumbnail_path || '/lovable-uploads/f33f7261-05f8-42bc-8f5d-73dddc791ac5.png'}
              alt={course.title}
              className="w-full aspect-video object-cover"
            />
          </div>

          {/* Mobile Condensed Payment Card */}
          <Card className="mb-6 mx-4">
            <CardContent className="p-4">
              <div className="space-y-4">
                <h1 className="text-lg font-bold leading-tight">{course.title}</h1>
                
                {/* Rating and Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(course.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{course.rating}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">
                      {(selectedCourse?.price ?? 0).toLocaleString()}원
                    </div>
                    <div className="text-xs text-muted-foreground line-through">
                      {(selectedCourse?.original_price ?? 0).toLocaleString()}원
                    </div>
                  </div>
                </div>

                {/* Mobile Options Selection */}
                <div className="space-y-2">
                  {courseOptions.map((option) => (
                    <div 
                      key={option.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedOption === option.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedOption(option.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{option.name}</span>
                        <div className="text-right">
                          <div className="font-bold text-primary text-sm">
                            {option.price.toLocaleString()}원
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Content Navigation */}
          <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm mb-8 mx-4">
            <div className="grid grid-cols-4 gap-0 py-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => scrollToSection('overview')}
                className="rounded-none border-r border-border first:rounded-l-md last:rounded-r-md last:border-r-0 flex-1 justify-center text-xs"
              >
                소개
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => scrollToSection('curriculum')}
                className="rounded-none border-r border-border first:rounded-l-md last:rounded-r-md last:border-r-0 flex-1 justify-center text-xs"
              >
                커리큘럼
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => scrollToSection('instructor')}
                className="rounded-none border-r border-border first:rounded-l-md last:rounded-r-md last:border-r-0 flex-1 justify-center text-xs"
              >
                크리에이터
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => scrollToSection('reviews')}
                className="rounded-none border-r border-border first:rounded-l-md last:rounded-r-md last:border-r-0 flex-1 justify-center text-xs"
              >
                후기
              </Button>
            </div>
          </div>

          {/* Mobile Content */}
          <div className="mx-4 space-y-8">
            {/* Course Detail Image */}
            <div id="overview">
              <img
                src={course.detail_image_path || courseDetailLong}
                alt="강의 상세 내용"
                className="w-full h-auto rounded-xl shadow-lg"
              />
            </div>

            {/* What You'll Learn */}
            <section className="bg-muted/30 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">이 강의에서 배우는 것들</h2>
              <div className="space-y-3">
                {(course.what_you_will_learn || []).map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Mobile Curriculum */}
            <section id="curriculum">
              <h2 className="text-xl font-bold mb-4">커리큘럼</h2>
              <div className="space-y-3">
                {groupedSessions.map((section, sectionIndex) => (
                  <Card key={sectionIndex}>
                    <CardContent className="p-0">
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setExpandedSection(expandedSection === sectionIndex ? null : sectionIndex)}
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{section.title}</h3>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {section.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {section.lessonCount}개 강의
                            </span>
                          </div>
                        </div>
                        {expandedSection === sectionIndex ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      
                      {expandedSection === sectionIndex && (
                        <div className="border-t border-border">
                          {section.lessons.map((lesson: any, lessonIndex: number) => (
                            <div key={lessonIndex} className="flex items-center justify-between p-3 border-b border-border last:border-b-0">
                              <div className="flex items-center gap-2">
                                <Play className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs">{lesson.title}</span>
                                {lesson.isPreview && (
                                  <Badge variant="outline" className="text-xs">미리보기</Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Mobile Instructor */}
            <section id="instructor" className="bg-muted/30 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">강사 소개</h2>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{course.profiles?.full_name || "강사"}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{course.description}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{course.total_students.toLocaleString()}명</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span>{course.rating}점</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Mobile Reviews */}
            <section id="reviews" className="mb-20">
              <h2 className="text-xl font-bold mb-4">수강생 후기</h2>
              <div className="space-y-4">
                {courseReviews.map((review, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm">{review.profiles?.full_name || "익명"}</span>
                            <div className="flex items-center">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{review.review_text}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Mobile Fixed Bottom Purchase Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">총 결제금액</div>
              <div className="text-lg font-bold text-primary">
                {(selectedCourse?.price ?? 0).toLocaleString()}원
              </div>
            </div>
            <Button 
              variant="default" 
              size="lg" 
              className="bg-primary hover:bg-primary/90 px-8"
              onClick={handleEnroll}
              disabled={enrolling}
            >
              {enrolling ? "등록 중..." : "강의 구매하기"}
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CourseDetail;