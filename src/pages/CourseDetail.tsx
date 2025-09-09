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
  User,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseDetailImages } from "@/components/CourseDetailImages";
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
  tag?: string; // Add tag field
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

interface CourseData {
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
    instructor_bio?: string;
    instructor_avatar_url?: string;
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
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [courseSessions, setCourseSessions] = useState<CourseSession[]>([]);
  const [courseReviews, setCourseReviews] = useState<CourseReview[]>([]);
  const [groupedSections, setGroupedSections] = useState<any[]>([]); // Add state for sections
  const [loading, setLoading] = useState(true);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
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

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const fetchCourseData = async () => {
    if (!courseId) return;
    
    setLoading(true);
    try {
      // Fetch course details with instructor info
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          profiles:instructor_id(full_name, instructor_bio, instructor_avatar_url),
          categories:category_id(name)
        `)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourseData(course);

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

      // Fetch course sections with sessions
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('course_sections')
        .select(`
          *,
          course_sessions(*)
        `)
        .eq('course_id', courseId)
        .order('order_index');

      if (sectionsError) throw sectionsError;

      // Store sections data for proper display
      const transformedSections = (sectionsData || []).map(section => ({
        id: section.id,
        title: section.title,
        order_index: section.order_index,
        duration: '',
        lessonCount: 0,
        lessons: (section.course_sessions || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((session: any) => {
            return {
              id: session.id,
              title: session.title,
              duration: `${session.duration_minutes}분`,
              isPreview: session.is_preview
            };
          })
      }));

      // Calculate duration and lesson count for each section
      transformedSections.forEach(section => {
        section.lessonCount = section.lessons.length;
        const totalMinutes = section.lessons.reduce((total, lesson) => {
          const durationNum = parseInt(lesson.duration.replace('분', ''));
          return total + durationNum;
        }, 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        section.duration = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
      });

      // Set the grouped sections for display
      setGroupedSections(transformedSections);

      // Also maintain the flat sessions list for compatibility
      const allSessions: CourseSession[] = [];
      (sectionsData || []).forEach(section => {
        (section.course_sessions || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .forEach((session: any) => {
            allSessions.push({
              id: session.id,
              title: session.title,
              description: session.description,
              order_index: session.order_index,
              duration_minutes: session.duration_minutes,
              is_preview: session.is_preview
            });
          });
      });

      setCourseSessions(allSessions);

      // Fetch course reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('course_reviews')
        .select(`
          *,
          profiles:user_id(full_name)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

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

  // Use the properly structured sections data instead of grouping sessions arbitrarily
  const sectionsToDisplay = groupedSections.length > 0 ? groupedSections : 
    // Fallback to old grouping method if no sections data
    courseSessions.reduce((groups: any[], session, index) => {
      const groupIndex = Math.floor(index / 4);
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

  // Convert duration to hours and minutes for fallback sections only
  if (sectionsToDisplay.length > 0 && !groupedSections.length) {
    sectionsToDisplay.forEach(group => {
      const hours = Math.floor(group.duration / 60);
      const minutes = group.duration % 60;
      group.duration = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
    });
  }

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

  if (!courseData) {
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
          <span className="text-primary font-medium">{courseData.categories?.name || "카테고리"}</span>
          <span className="text-muted-foreground">{">"}</span>
          <span className="text-muted-foreground">{courseData.level}</span>
        </div>

        {/* Desktop Layout: 2-column structure with fixed widths */}
        <div className="hidden lg:flex gap-8 justify-center">
          {/* Left Column: Video and Content - Fixed 757px width */}
          <div className="w-[757px] flex-shrink-0">
            {/* Thumbnail Section - Desktop: 757x426, Mobile: responsive */}
            <div className="relative rounded-xl overflow-hidden shadow-lg mb-6">
              <img
                src={courseData.thumbnail_path || '/lovable-uploads/f33f7261-05f8-42bc-8f5d-73dddc791ac5.png'}
                alt={courseData.title}
                className="w-[757px] h-[426px] object-cover"
              />
            </div>

            {/* Sticky Navigation Bar - Full width 4-column layout */}
            <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm mb-8">
              <div className="w-full max-w-[757px] grid grid-cols-4 gap-0 border border-border rounded-md overflow-hidden">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => scrollToSection('overview')}
                  className="rounded-none border-r border-border flex-1 justify-center border-t-0 border-b-0 border-l-0 h-10 text-sm"
                >
                  강의 안내
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => scrollToSection('curriculum')}
                  className="rounded-none border-r border-border flex-1 justify-center border-t-0 border-b-0 border-l-0 h-10 text-sm"
                >
                  커리큘럼
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => scrollToSection('instructor')}
                  className="rounded-none border-r border-border flex-1 justify-center border-t-0 border-b-0 border-l-0 h-10 text-sm"
                >
                  강사 소개
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => scrollToSection('reviews')}
                  className="rounded-none flex-1 justify-center border-t-0 border-b-0 border-l-0 border-r-0 h-10 text-sm"
                >
                  강의 후기
                </Button>
              </div>
            </div>

            {/* Main Content Area - 757px width */}
            <div className="w-[757px] space-y-8">
              {/* Long Course Detail Image */}
              <div id="overview" className="w-[757px]">
                <CourseDetailImages courseId={courseId!} />
              </div>

              {/* Course Content Sections */}
              <div className="space-y-12">
                {/* What You'll Learn */}
                <section id="overview">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold">이 강의에서 배우는 것들</h2>
                  </div>
                  <div className="bg-muted/30 rounded-2xl p-8">
                    <div className="grid md:grid-cols-2 gap-4">
                      {(courseData.what_you_will_learn || []).map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                          <span className="text-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Curriculum */}
                <section id="curriculum">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold">커리큘럼</h2>
                  </div>
                  <div className="space-y-4">
                    {sectionsToDisplay.map((section, sectionIndex) => (
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
                <section id="instructor">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold">강사 소개</h2>
                  </div>
                  <div className="bg-muted/30 rounded-2xl p-8">
                    <div className="flex items-start gap-6">
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {courseData.profiles?.instructor_avatar_url ? (
                          <img 
                            src={courseData.profiles.instructor_avatar_url}
                            alt={courseData.profiles?.full_name || "강사"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{courseData.profiles?.full_name || "강사"}</h3>
                        {courseData.profiles?.instructor_bio && (
                          <p className="text-muted-foreground">{courseData.profiles.instructor_bio}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Reviews */}
                <section id="reviews">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold">수강생 후기</h2>
                  </div>
                  <div className="space-y-6">
                    {courseReviews.length > 0 ? (
                      courseReviews.map((review, index) => (
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
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>아직 등록된 후기가 없습니다.</p>
                      </div>
                    )}
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
                    {courseData.title}
                  </h1>


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
                  {selectedCourse?.benefits && selectedCourse.benefits.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground">포함 혜택</h3>
                      <div className="space-y-2">
                        {selectedCourse.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
              src={courseData.thumbnail_path || '/lovable-uploads/f33f7261-05f8-42bc-8f5d-73dddc791ac5.png'}
              alt={courseData.title}
              className="w-full aspect-video object-cover"
            />
          </div>

          {/* Mobile Condensed Payment Card */}
          <Card className="mb-6 mx-4">
            <CardContent className="p-4">
              <div className="space-y-4">
                <h1 className="text-lg font-bold leading-tight">{courseData.title}</h1>
                
                {/* Rating and Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(courseData.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{courseData.rating}</span>
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
              <CourseDetailImages courseId={courseId!} />
            </div>

            {/* What You'll Learn */}
            <section className="bg-muted/30 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">이 강의에서 배우는 것들</h2>
              <div className="space-y-3">
                {(courseData.what_you_will_learn || []).map((item, index) => (
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
                {sectionsToDisplay.map((section, sectionIndex) => (
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
                  <h3 className="text-lg font-semibold mb-2">{courseData.profiles?.full_name || "강사"}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{courseData.description}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{courseData.total_students.toLocaleString()}명</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span>{courseData.rating}점</span>
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

        {/* Scroll to Top Button */}
        {showScrollToTop && (
          <Button
            onClick={scrollToTop}
            size="sm"
            className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-50 w-12 h-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white animate-fade-in hover:scale-110 transition-transform duration-200"
            aria-label="맨 위로 이동"
          >
            <ChevronUp className="w-5 h-5" />
          </Button>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default CourseDetail;