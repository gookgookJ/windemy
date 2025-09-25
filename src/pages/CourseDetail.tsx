import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Play,
  Clock,
  Users,
  Star,
  BookOpen,
  CheckCircle,
  User,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AuthModal } from "@/components/auth/AuthModal";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CourseDetailImages } from "@/components/CourseDetailImages";
// Import Accordion components for improved accessibility and structure
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// --- TypeScript Interfaces (Enhanced) ---

interface CourseOption {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  benefits: string[];
  tag?: string;
}

interface CourseReview {
  id: string;
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
  instructor_id: string;
  level: string;
  rating: number;
  total_students: number;
  what_you_will_learn?: string[];
  thumbnail_path?: string;
  detail_image_path?: string;
  categories?: {
    name: string;
  };
}

interface InstructorInfo {
  full_name?: string;
  instructor_bio?: string;
  instructor_avatar_url?: string;
}

// UI-specific interfaces for structured curriculum data
interface LessonUI {
    id: string;
    title: string;
    durationMinutes: number; // Store raw number for calculation
    isPreview: boolean;
}

interface SectionUI {
    id: string;
    title: string;
    lessons: LessonUI[];
    totalMinutes: number;
    lessonCount: number;
}

// Helper function for formatting duration
const formatDuration = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
        return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
};

// --- Main Component ---

const CourseDetail = () => {
  // State Management
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [courseReviews, setCourseReviews] = useState<CourseReview[]>([]);
  const [groupedSections, setGroupedSections] = useState<SectionUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showAlreadyEnrolledModal, setShowAlreadyEnrolledModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [instructorInfo, setInstructorInfo] = useState<InstructorInfo | null>(null);

  // Hooks
  const navigate = useNavigate();
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  // --- Effects ---

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  // Scroll to top functionality and header visibility tracking
  const [headerVisible, setHeaderVisible] = useState(true);

  useEffect(() => {
    let ticking = false;
    let lastScrollY = 0;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setShowScrollToTop(currentScrollY > 500);
          
          // Track header visibility on mobile
          if (window.innerWidth < 1024) { // lg breakpoint
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
              setHeaderVisible(false);
            } else if (currentScrollY < lastScrollY) {
              setHeaderVisible(true);
            }
          } else {
            setHeaderVisible(true);
          }
          
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Data Fetching and Processing (Refactored) ---

  const fetchCourseData = async () => {
    if (!courseId) return;

    setLoading(true);
    try {
      // 1. Fetch Core Course Details
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select(`
          id, title, instructor_id, level, rating, total_students,
          what_you_will_learn, thumbnail_path, detail_image_path,
          categories:category_id(name)
        `)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      if (!course) throw new Error("Course data not found");
        
      setCourseData(course as CourseData);

      // 2. Fetch Instructor Details (Fixed Logic: Use instructor_id)
      if (course.instructor_id) {
        fetchInstructorInfo(course.instructor_id);
      }

      // 3. Fetch Related Data (Parallelized)
      const [optionsResult, sectionsResult, reviewsResult] = await Promise.all([
        supabase.from('course_options').select('*').eq('course_id', courseId).order('price'),
        // Explicitly select fields to ensure type safety and clarity
        supabase.from('course_sections').select(`
            id, title, order_index,
            course_sessions (id, title, order_index, duration_minutes, is_preview)
        `).eq('course_id', courseId).order('order_index'),
        supabase.from('course_reviews').select(`*, profiles:user_id(full_name)`).eq('course_id', courseId).order('created_at', { ascending: false })
      ]);

      // Process Options
      if (optionsResult.error) console.warn("Error fetching options:", optionsResult.error);
      const optionsData = (optionsResult.data as CourseOption[]) || [];
      setCourseOptions(optionsData);
      if (optionsData.length > 0) {
        setSelectedOption(optionsData[0].id);
      }

      // Process Reviews
      if (reviewsResult.error) console.warn("Error fetching reviews:", reviewsResult.error);
      setCourseReviews((reviewsResult.data as CourseReview[]) || []);

      // Process Sections (Type Safety Applied)
      if (sectionsResult.error) console.warn("Error fetching sections:", sectionsResult.error);
      const sectionsData = sectionsResult.data || [];

      // Transform data structure for UI
      const transformedSections: SectionUI[] = sectionsData.map((section: any) => {
        // Ensure sessions are sorted
        const sortedSessions = (section.course_sessions || []).sort((a: any, b: any) => a.order_index - b.order_index);

        const lessons: LessonUI[] = sortedSessions.map((session: any): LessonUI => ({
                id: session.id,
                title: session.title,
                durationMinutes: session.duration_minutes || 0,
                isPreview: session.is_preview
            }));

        const totalMinutes = lessons.reduce((total, lesson) => total + lesson.durationMinutes, 0);

        return {
            id: section.id,
            title: section.title,
            lessons,
            totalMinutes,
            lessonCount: lessons.length
        };
      });

      setGroupedSections(transformedSections);

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

  const fetchInstructorInfo = async (instructorId: string) => {
    try {
      // Use security definer function to bypass RLS safely and fetch public instructor info
      const { data, error } = await supabase.rpc('get_instructor_public_info', {
        instructor_id: instructorId,
      });

      if (error) {
        console.warn('Failed to load instructor info via RPC', error);
        setInstructorInfo({
          full_name: '강사',
          instructor_bio: '강사 정보를 불러올 수 없습니다.',
          instructor_avatar_url: null,
        });
        return;
      }

      const row = Array.isArray(data) ? data[0] : null;
      if (row) {
        setInstructorInfo({
          full_name: row.full_name,
          instructor_bio: row.instructor_bio,
          instructor_avatar_url: row.instructor_avatar_url,
        });
      } else {
        setInstructorInfo({
          full_name: '강사',
          instructor_bio: '강사 정보를 불러올 수 없습니다.',
          instructor_avatar_url: null,
        });
      }
    } catch (e) {
      console.warn('Error during instructor info fetching', e);
      setInstructorInfo({
        full_name: '강사',
        instructor_bio: '강사 정보를 불러올 수 없습니다.',
        instructor_avatar_url: null,
      });
    }
  };

  // --- Event Handlers ---

  const handlePurchase = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!courseId) return;

    if (!selectedOption) {
      toast({ title: "강의 옵션 선택", description: "구매할 강의 옵션을 선택해주세요.", variant: "destructive" });
      return;
    }

    // Check enrollment status
    try {
      const { data: existingEnrollment, error } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      // PGRST116 means no rows found (not enrolled), which is acceptable here
      if (error && error.code !== 'PGRST116') throw error;

      if (existingEnrollment) {
        setShowAlreadyEnrolledModal(true);
        return;
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
      toast({ title: "확인 실패", description: "수강 등록 상태 확인 중 오류가 발생했습니다.", variant: "destructive" });
      return;
    }

    // Navigate to payment
    const paymentUrl = `/payment/${courseId}?option=${selectedOption}`;
    navigate(paymentUrl);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // (수정됨) 스크롤 오프셋 조정 - 헤더 상태에 따라 다르게 처리
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // 모바일에서 헤더 상태에 따라 오프셋 조정
      let headerOffset = 130; // 기본값: 헤더(80px) + 네비게이션 바(약 50px)
      
      if (window.innerWidth < 1024) { // 모바일/태블릿
        headerOffset = headerVisible ? 130 : 80; // 헤더가 사라지면 네비게이션 바만 고려
      }
      
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
         top: offsetPosition,
         behavior: 'smooth'
      });
    }
  };

  // --- Derived State ---
  const selectedCourse = courseOptions.find(option => option.id === selectedOption);

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="bg-background">
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
        <div className="bg-background">
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

  // --- Unified Responsive Layout ---
  return (
    <div className="bg-background">
      {/* Header (가정: 고정되어 있으며 높이는 약 80px, z-50) */}
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Layout: Responsive Flex Container */}
        {/* 수정됨: lg:items-start 추가하여 데스크톱에서 컬럼 상단을 정렬 */}
        <div className="flex flex-col lg:flex-row gap-8 justify-center lg:items-start">

          {/* Left Column: Content */}
          <div className="w-full lg:max-w-[757px] flex-shrink-0 pb-20 lg:pb-8">

            {/* Thumbnail Section */}
            <div className="relative rounded-xl overflow-hidden shadow-lg mb-6">
              <img
                src={courseData.thumbnail_path || '/lovable-uploads/f33f7261-05f8-42bc-8f5d-73dddc791ac5.png'}
                alt={courseData.title}
                // Responsive Sizing: aspect-video on mobile, fixed height on desktop
                className="w-full aspect-video lg:h-[426px] object-cover"
              />
            </div>

            {/* Mobile Purchase Card (Visible only on Mobile/Tablet) */}
             <div className="lg:hidden mb-8">
                 <Card>
                     <CardContent className="p-4 sm:p-6">
                         <div className="space-y-4 sm:space-y-6">
                         <h1 className="text-lg sm:text-xl font-bold leading-tight">{courseData.title}</h1>

                         {/* Selected Course Benefits (PC와 유사한 구조) */}
                         {selectedCourse?.benefits && selectedCourse.benefits.length > 0 && (
                             <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                             <h3 className="text-sm sm:text-base font-medium mb-2 sm:mb-3 text-foreground">포함 혜택</h3>
                             <ul className="space-y-1 sm:space-y-2">
                                 {selectedCourse.benefits.map((benefit, index) => (
                                 <li key={index} className="flex items-start gap-2">
                                     <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                     <span className="text-xs sm:text-sm text-muted-foreground">{benefit}</span>
                                 </li>
                                 ))}
                             </ul>
                             </div>
                         )}


                         {/* Options Selection (옵션명만 표시) */}
                         <div className="space-y-3 sm:space-y-4">
                             <h3 className="text-sm sm:text-base font-medium text-muted-foreground">강의 구성</h3>
                             <div className="space-y-2">
                             {courseOptions.map((option) => (
                                 <div
                                 key={option.id}
                                 className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
                                     selectedOption === option.id
                                     ? 'border-primary bg-primary/5'
                                     : 'border-border hover:border-primary/50'
                                 }`}
                                 onClick={() => setSelectedOption(option.id)}
                                 role="button"
                                 tabIndex={0}
                                 onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedOption(option.id)}
                                 >
                                 <div className="flex items-center justify-between">
                                     <span className="text-sm sm:text-base font-medium">{option.name}</span>
                                     <div className="text-right">
                                     <div className="font-bold text-primary text-sm sm:text-base">
                                         {option.price.toLocaleString()}원
                                     </div>
                                     {option.original_price && (
                                         <div className="text-xs sm:text-sm text-muted-foreground line-through">
                                         {option.original_price.toLocaleString()}원
                                         </div>
                                     )}
                                     </div>
                                 </div>
                                 </div>
                             ))}
                             </div>
                         </div>
                         </div>
                     </CardContent>
                 </Card>
             </div>


            {/* Sticky Navigation Bar */}
            {/* 수정됨: 모바일에서 헤더 상태에 따라 top 위치 조정 */}
            <div className={`sticky z-50 bg-background border border-border mb-8 overflow-hidden shadow-md transition-all duration-300 ${
              headerVisible ? 'top-16' : 'top-0'
            }`}>
              <div className="grid grid-cols-4 gap-0">
                {/* Responsive Button Styles */}
                <button
                  onClick={() => scrollToSection('overview')}
                  className="px-3 lg:px-4 py-3 text-xs lg:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-r border-border last:border-r-0"
                >
                  <span className="lg:hidden">소개</span>
                  <span className="hidden lg:inline">강의 안내</span>
                </button>
                <button
                  onClick={() => scrollToSection('curriculum')}
                  className="px-3 lg:px-4 py-3 text-xs lg:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-r border-border last:border-r-0"
                >
                  커리큘럼
                </button>
                <button
                  onClick={() => scrollToSection('instructor')}
                  className="px-3 lg:px-4 py-3 text-xs lg:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-r border-border last:border-r-0"
                >
                  강사 소개
                </button>
                <button
                  onClick={() => scrollToSection('reviews')}
                  className="px-3 lg:px-4 py-3 text-xs lg:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  후기
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-12 lg:space-y-16">

              {/* Course Detail Images */}
              <div id="overview">
                {/* Display detail_image_path if exists */}
                {courseData.detail_image_path && (
                  <div className="mb-8">
                    <img
                      src={courseData.detail_image_path}
                      alt={`${courseData.title} 상세 이미지`}
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                )}

                {/* Display additional course detail images */}
                <CourseDetailImages courseId={courseId!} />
              </div>

              {/* What You'll Learn */}
              <section>
                <h2 className="text-xl lg:text-2xl font-bold mb-6">이 강의에서 배우는 것들</h2>
                <div className="bg-muted/30 rounded-2xl p-6 lg:p-8">
                  <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
                    {(courseData.what_you_will_learn || []).map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                        <span className="text-foreground text-sm lg:text-base">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Curriculum (Using Accordion for Accessibility) */}
              <section id="curriculum">
                <h2 className="text-xl lg:text-2xl font-bold mb-6">커리큘럼</h2>
                {/* Defaulting the first section to open if available. Using type="single" collapsible. */}
                <Accordion type="single" collapsible defaultValue={groupedSections.length > 0 ? groupedSections[0].id : undefined} className="space-y-4">
                    {groupedSections.map((section) => (
                        <AccordionItem key={section.id} value={section.id} className="border border-border rounded-lg bg-card shadow-sm">
                            <AccordionTrigger className="p-4 lg:p-6 hover:bg-muted/50 transition-colors rounded-lg">
                                <div className="flex-1 text-left pr-4">
                                    <h3 className="font-semibold text-base lg:text-lg mb-1">{section.title}</h3>
                                    <div className="flex items-center gap-4 text-xs lg:text-sm text-muted-foreground font-normal">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3 lg:w-4 lg:h-4" />
                                            {formatDuration(section.totalMinutes)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-3 h-3 lg:w-4 lg:h-4" />
                                            {section.lessonCount}개 강의
                                        </span>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="border-t border-border">
                                {section.lessons.map((lesson) => (
                                    <div key={lesson.id} className="flex items-center justify-between p-3 lg:p-4 border-b border-border last:border-b-0">
                                        <div className="flex items-center gap-3">
                                            <Play className="w-3 h-3 lg:w-4 lg:h-4 text-muted-foreground" />
                                            <span className="text-xs lg:text-sm">{lesson.title}</span>
                                            {lesson.isPreview && (
                                                <Badge variant="outline" className="text-xs">미리보기</Badge>
                                            )}
                                        </div>
                                        <span className="text-xs lg:text-sm text-muted-foreground">
                                            {formatDuration(lesson.durationMinutes)}
                                        </span>
                                    </div>
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
              </section>

              {/* Instructor */}
              <section id="instructor">
                <h2 className="text-xl lg:text-2xl font-bold mb-6">강사 소개</h2>
                <div className="bg-muted/30 rounded-2xl p-6 lg:p-8">
                  <div className="flex items-start gap-4 lg:gap-6">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {instructorInfo?.instructor_avatar_url ? (
                        <img
                          src={instructorInfo.instructor_avatar_url}
                          alt={instructorInfo.full_name || '강사'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 lg:w-10 lg:h-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg lg:text-xl font-semibold mb-2">
                        {instructorInfo?.full_name || '강사 정보를 불러오는 중...'}
                      </h3>
                      {instructorInfo?.instructor_bio ? (
                        <p className="text-muted-foreground text-sm lg:text-base mb-3 whitespace-pre-wrap">
                          {instructorInfo.instructor_bio}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-sm lg:text-base mb-3">
                          {instructorInfo ? '강사 소개가 준비 중입니다.' : '강사 정보를 불러오는 중...'}
                        </p>
                      )}
                     </div>
                   </div>
                 </div>
               </section>

              {/* Reviews */}
              <section id="reviews">
                <h2 className="text-xl lg:text-2xl font-bold mb-6">수강생 후기</h2>
                <div className="space-y-4 lg:space-y-6">
                  {courseReviews.length > 0 ? (
                    courseReviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-4 lg:p-6">
                          <div className="flex items-start gap-3 lg:gap-4">
                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                                <span className="font-medium text-sm lg:text-base">{review.profiles?.full_name || "익명"}</span>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                    {[...Array(review.rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                                    ))}
                                    </div>
                                    <span className="text-xs lg:text-sm text-muted-foreground">
                                    {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                              </div>
                              <p className="text-muted-foreground text-sm lg:text-base">{review.review_text}</p>
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

          {/* Right Column: Sticky Purchase Card (Desktop Only) */}
          <div className="hidden lg:block sticky top-20 w-[383px] flex-shrink-0 self-start">
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
                    {/* Example Badge, replace with dynamic data if available */}
                    <Badge variant="destructive" className="text-sm">
                        2차 얼리버드
                    </Badge>
                    </div>
                    {selectedCourse?.original_price && (
                         <div className="text-sm text-muted-foreground line-through">
                            {selectedCourse.original_price.toLocaleString()}원
                        </div>
                    )}
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
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedOption(option.id)}
                        >
                        <div className="flex items-center justify-between">
                            <div className="flex-1 pr-4">
                                <span className="text-sm font-medium">{option.name}</span>
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
                    <Button
                    variant="default"
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={handlePurchase}
                    >
                    강의 구매하기
                    </Button>
                </div>
                </div>
            </Card>
          </div>
        </div>

        {/* Mobile Fixed Bottom Purchase Bar (Visible only on Mobile/Tablet) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50 shadow-top">
          <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
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
              onClick={handlePurchase}
            >
              강의 구매하기
            </Button>
          </div>
        </div>

        {/* Scroll to Top Button */}
        {showScrollToTop && (
          <Button
            onClick={scrollToTop}
            size="icon"
            // Adjust bottom position on mobile (bottom-20) to avoid overlap with the purchase bar
            className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-50 w-12 h-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white transition-transform duration-200 hover:scale-105"
            aria-label="맨 위로 이동"
          >
            <ChevronUp className="w-6 h-6" />
          </Button>
        )}

        {/* Modals */}
        <AlertDialog open={showAlreadyEnrolledModal} onOpenChange={setShowAlreadyEnrolledModal}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <AlertDialogTitle className="text-left">이미 구매한 강의입니다</AlertDialogTitle>
                </div>
              </div>
              <AlertDialogDescription className="text-left">
                해당 강의는 이미 구매하여 수강 중인 강의입니다.
                내 강의실에서 수강을 계속 진행하세요.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAlreadyEnrolledModal(false)}
                className="w-full sm:w-auto"
              >
                닫기
              </Button>
              <AlertDialogAction
                onClick={() => navigate('/my-page')}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90"
              >
                내 강의실로 이동
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultTab="signin"
        />
      </main>
      <Footer />
    </div>
  );
};

export default CourseDetail;