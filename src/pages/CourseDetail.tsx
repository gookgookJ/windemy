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
import courseWebImg from "@/assets/course-web.jpg";
import courseDetailLong from "@/assets/course-detail-long.jpg";
import heroThumbnail from "/lovable-uploads/f33f7261-05f8-42bc-8f5d-73dddc791ac5.png";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CourseDetail = () => {
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>("online");
  const navigate = useNavigate();
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && courseId) {
      checkEnrollment();
    }
  }, [user, courseId]);

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

  const course = {
    title: "핸드폰 하나로 하루 3시간 일하며 월 순익 천만원 벌어가는 공동구매 중개의 정석",
    instructor: "전민우",
    instructorImage: "/placeholder-instructor.jpg",
    instructorBio: "공동구매 중개 분야 10년차 전문가로, 수많은 성공 사례를 보유하고 있습니다.",
    thumbnail: heroThumbnail,
    basePrice: 2650000,
    originalPrice: 3500000,
    rating: 4.9,
    reviewCount: 847,
    duration: "120시간",
    studentCount: 5420,
    level: "초급",
    category: "비즈니스/창업",
    tags: ["공동구매", "중개업", "부업", "창업"],
    description: "핸드폰 하나로 하루 3시간만 투자하여 월 순익 천만원을 만드는 공동구매 중개의 모든 노하우를 전수합니다.",
    whatYouWillLearn: [
      "공동구매 중개 시장 분석 및 진입 전략",
      "수익성 높은 상품군 발굴 및 소싱 방법",
      "효과적인 마케팅 및 고객 관리 시스템",
      "리스크 관리 및 법적 이슈 대응",
      "자동화 시스템 구축으로 시간 효율성 극대화",
    ],
    requirements: [
      "스마트폰 사용 가능",
      "기본적인 온라인 업무 처리 능력",
      "성실한 학습 의지",
    ],
    options: [
      {
        id: "online",
        name: "온라인 강의",
        price: 2650000,
        originalPrice: 3500000,
        benefits: [
          "💰 수료 후 매출 천만원 보장",
          "🎁 신청만 해도 300만원 상당 혜택 제공",
          "💪 1:1로 케어하는 스파르타 학습 시스템",
          "📱 핸드폰 하나로 완전 자동화 시스템",
          "⚡ 하루 3시간 투자로 월 천만원 수익 보장",
          "🔒 평생 A/S 및 업데이트 지원"
        ]
      },
      {
        id: "offline",
        name: "오프라인 (소수정예 30명)",
        price: 2650000,
        originalPrice: 3500000,
        benefits: [
          "💰 수료 후 매출 천만원 보장",
          "🎁 신청만 해도 300만원 상당 혜택 제공",
          "💪 1:1로 케어하는 스파르타 학습 시스템",
          "📱 핸드폰 하나로 완전 자동화 시스템",
          "⚡ 하루 3시간 투자로 월 천만원 수익 보장",
          "🔒 평생 A/S 및 업데이트 지원",
          "👥 오프라인 네트워킹 및 실습",
          "🏆 현장 멘토링 및 즉석 피드백"
        ]
      }
    ],
    curriculum: [
      {
        title: "React 기초",
        duration: "4시간 30분",
        lessonCount: 12,
        lessons: [
          { title: "React 소개와 환경 설정", duration: "25분", isPreview: true },
          { title: "컴포넌트 기본 개념", duration: "20분", isPreview: true },
          { title: "JSX 문법 완전 정복", duration: "30분" },
          { title: "Props와 State", duration: "35분" },
        ]
      },
      {
        title: "React Hooks",
        duration: "6시간",
        lessonCount: 15,
        lessons: [
          { title: "useState Hook", duration: "40분" },
          { title: "useEffect Hook", duration: "45min" },
          { title: "Custom Hooks 만들기", duration: "50분" },
        ]
      },
      {
        title: "상태 관리",
        duration: "5시간",
        lessonCount: 10,
        lessons: [
          { title: "Context API", duration: "35분" },
          { title: "Redux 기초", duration: "60분" },
          { title: "Redux Toolkit", duration: "55분" },
        ]
      }
    ]
  };

  const reviews = [
    {
      name: "박학생",
      rating: 5,
      date: "2024.01.15",
      content: "정말 체계적이고 실무에 도움이 되는 강의입니다. 특히 프로젝트 실습이 좋았어요!",
    },
    {
      name: "김개발자",
      rating: 5,
      date: "2024.01.10",
      content: "설명이 정말 명확하고 이해하기 쉽게 되어있네요. 추천합니다!",
    }
  ];

  const selectedCourse = course.options.find(option => option.id === selectedOption);
  const discountRate = selectedCourse ? Math.round(((selectedCourse.originalPrice - selectedCourse.price) / selectedCourse.originalPrice) * 100) : 0;

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 text-sm mb-6">
          <span className="text-primary font-medium">{course.category}</span>
          <span className="text-muted-foreground">{">"}</span>
          <span className="text-muted-foreground">React</span>
        </div>

        {/* Main Layout: 2-column structure similar to reference */}
        <div className="flex gap-8">
          {/* Left Column: Video and Content */}
          <div className="flex-1 max-w-[calc(100%-383px-2rem)]">
            {/* Video Section */}
            <div className="relative rounded-xl overflow-hidden shadow-lg mb-6">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-64 lg:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <Button variant="hero" size="lg" className="rounded-full w-16 h-16 bg-white/20 hover:bg-white/30">
                  <Play className="w-6 h-6 text-white" />
                </Button>
              </div>
            </div>

            {/* Sticky Navigation Bar */}
            <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border mb-8">
              <div className="flex gap-2 py-3 overflow-x-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => scrollToSection('overview')}
                  className="whitespace-nowrap"
                >
                  소개
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => scrollToSection('curriculum')}
                  className="whitespace-nowrap"
                >
                  커리큘럼
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => scrollToSection('instructor')}
                  className="whitespace-nowrap"
                >
                  크리에이터
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => scrollToSection('reviews')}
                  className="whitespace-nowrap"
                >
                  후기 {course.reviewCount}
                </Button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-8">
              {/* Long Course Detail Image */}
              <div id="overview" className="w-full">
                <img
                  src={courseDetailLong}
                  alt="강의 상세 내용"
                  className="w-full h-auto rounded-xl shadow-lg"
                />
              </div>

              {/* Course Content Sections */}
              <div className="space-y-12">
                {/* What You'll Learn */}
                <section className="bg-muted/30 rounded-2xl p-8">
                  <h2 className="text-2xl font-bold mb-6">이 강의에서 배우는 것들</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {course.whatYouWillLearn.map((item, index) => (
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
                    {course.curriculum.map((section, sectionIndex) => (
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
                              {section.lessons.map((lesson, lessonIndex) => (
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
                      <h3 className="text-xl font-semibold mb-2">{course.instructor}</h3>
                      <p className="text-muted-foreground mb-4">{course.instructorBio}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{course.studentCount.toLocaleString()}명의 수강생</span>
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
                    {reviews.map((review, index) => (
                      <Card key={index}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              <User className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-medium">{review.name}</span>
                                <div className="flex items-center">
                                  {[...Array(review.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                                  ))}
                                </div>
                                <span className="text-sm text-muted-foreground">{review.date}</span>
                              </div>
                              <p className="text-muted-foreground">{review.content}</p>
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

          {/* Right Column: Fixed Purchase Card */}
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
                      <span className="text-sm text-muted-foreground">({course.reviewCount.toLocaleString()}개 후기)</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {discountRate}% 할인가 {(selectedCourse?.originalPrice ?? 0).toLocaleString()}원
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
                      {course.options.map((option) => (
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
                              {option.originalPrice && (
                                <div className="text-xs text-muted-foreground line-through">
                                  {option.originalPrice.toLocaleString()}원
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
                        {course.studentCount.toLocaleString()}
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

        {/* Mobile Purchase Card */}
        <div className="lg:hidden mt-8">
          <Card className="p-6">
            <div className="space-y-4">
              <h1 className="text-xl font-bold">{course.title}</h1>
              
              {/* Mobile Options */}
              <div className="space-y-3">
                {course.options.map((option) => (
                  <div 
                    key={option.id}
                    className={`p-3 border rounded-lg cursor-pointer ${
                      selectedOption === option.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setSelectedOption(option.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{option.name}</span>
                      <div className="text-right">
                        <div className="font-bold text-primary">
                          {option.price.toLocaleString()}원
                        </div>
                        {option.originalPrice && (
                          <div className="text-xs text-muted-foreground line-through">
                            {option.originalPrice.toLocaleString()}원
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Price */}
              <div className="p-4 border-2 border-primary/20 rounded-lg bg-background">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">총 결제 금액</span>
                  <div className="text-2xl font-bold text-primary">
                    {(selectedCourse?.price ?? 0).toLocaleString()}원
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {isEnrolled ? (
                  <Button 
                    variant="default" 
                    size="lg" 
                    className="w-full"
                    onClick={() => navigate(`/learn/${courseId}`)}
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    학습 계속하기
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    size="lg" 
                    className="w-full"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    {enrolling ? "등록 중..." : "강의 구매하기"}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CourseDetail;