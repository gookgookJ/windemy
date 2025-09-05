import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import courseWebImg from "@/assets/course-web.jpg";

const CourseDetail = () => {
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const navigate = useNavigate();

  const course = {
    title: "실무에 바로 적용하는 React.js 완전정복",
    instructor: "김개발",
    instructorImage: "/placeholder-instructor.jpg",
    instructorBio: "현직 시니어 프론트엔드 개발자로 10년 이상의 실무 경험을 보유하고 있습니다.",
    thumbnail: courseWebImg,
    price: 89000,
    originalPrice: 120000,
    rating: 4.9,
    reviewCount: 1250,
    duration: "32시간",
    studentCount: 15000,
    level: "중급",
    category: "개발/프로그래밍",
    tags: ["React", "JavaScript", "Frontend", "웹개발"],
    description: "실무에서 바로 활용할 수 있는 React.js 기술을 체계적으로 학습합니다. 기초부터 고급 패턴까지 모든 것을 다룹니다.",
    whatYouWillLearn: [
      "React 기본 개념과 컴포넌트 설계",
      "상태 관리와 생명주기 이해",
      "React Hooks의 완전한 활용",
      "성능 최적화 기법",
      "실제 프로젝트 구현",
    ],
    requirements: [
      "JavaScript 기본 문법 이해",
      "HTML/CSS 기초 지식",
      "개발 환경 설정 가능",
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

  const discountRate = Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Header */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-primary font-medium">{course.category}</span>
                <span className="text-muted-foreground">{">"}</span>
                <span className="text-muted-foreground">React</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                {course.title}
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                {course.description}
              </p>

              {/* Course Stats */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-warning fill-current" />
                  <span className="font-medium">{course.rating}</span>
                  <span className="text-muted-foreground">({course.reviewCount.toLocaleString()}개 리뷰)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{course.studentCount.toLocaleString()}명 수강</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{course.duration}</span>
                </div>
                <Badge className="bg-level-intermediate text-white">
                  {course.level}
                </Badge>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-primary border-primary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Course Content Tabs */}
            <Tabs defaultValue="curriculum" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="curriculum">커리큘럼</TabsTrigger>
                <TabsTrigger value="overview">강의 소개</TabsTrigger>
                <TabsTrigger value="instructor">강사 소개</TabsTrigger>
                <TabsTrigger value="reviews">수강 후기</TabsTrigger>
              </TabsList>

              <TabsContent value="curriculum" className="space-y-4">
                <div className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-4">전체 커리큘럼</h3>
                  <div className="space-y-3">
                    {course.curriculum.map((section, index) => (
                      <Card key={index} className="overflow-hidden">
                        <div
                          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedSection(expandedSection === index ? null : index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {expandedSection === index ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                              <div>
                                <h4 className="font-semibold">{section.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {section.lessonCount}개 레슨 • {section.duration}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {expandedSection === index && (
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              {section.lessons.map((lesson, lessonIndex) => (
                                <div key={lessonIndex} className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <Play className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">{lesson.title}</span>
                                    {lesson.isPreview && (
                                      <Badge variant="outline" className="text-xs">
                                        미리보기
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="overview">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold mb-4">이 강의에서 배우는 것들</h3>
                      <div className="grid gap-3">
                        {course.whatYouWillLearn.map((item, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold mb-4">수강 요구사항</h3>
                      <div className="grid gap-3">
                        {course.requirements.map((item, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="instructor">
                <Card className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">김</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{course.instructor}</h3>
                      <p className="text-muted-foreground mb-4">{course.instructorBio}</p>
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">25+</div>
                          <div className="text-sm text-muted-foreground">강의 수</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">50K+</div>
                          <div className="text-sm text-muted-foreground">총 수강생</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">4.9</div>
                          <div className="text-sm text-muted-foreground">평균 평점</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="flex items-center gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary">{course.rating}</div>
                        <div className="flex items-center justify-center gap-1 my-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-warning fill-current" />
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">{course.reviewCount}개 리뷰</div>
                      </div>
                      <div className="flex-1">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center gap-3 mb-2">
                            <span className="text-sm w-3">{rating}</span>
                            <Star className="w-4 h-4 text-warning fill-current" />
                            <Progress value={rating === 5 ? 80 : rating === 4 ? 15 : 5} className="flex-1" />
                            <span className="text-sm text-muted-foreground w-8">
                              {rating === 5 ? '80%' : rating === 4 ? '15%' : '5%'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  <div className="space-y-4">
                    {reviews.map((review, index) => (
                      <Card key={index} className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                              <span className="font-medium">{review.name.charAt(0)}</span>
                            </div>
                            <div>
                              <div className="font-medium">{review.name}</div>
                              <div className="text-sm text-muted-foreground">{review.date}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 text-warning fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground">{review.content}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Video Preview */}
            <Card className="overflow-hidden">
              <div className="relative">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Button variant="hero" size="lg" className="rounded-full w-16 h-16">
                    <Play className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Purchase Card */}
            <Card className="p-6 sticky top-24">
              <div className="space-y-6">
                {/* Price */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-primary">
                      {course.price.toLocaleString()}원
                    </span>
                    {course.originalPrice && (
                      <Badge className="bg-destructive text-destructive-foreground">
                        {discountRate}% 할인
                      </Badge>
                    )}
                  </div>
                  {course.originalPrice && (
                    <span className="text-muted-foreground line-through">
                      {course.originalPrice.toLocaleString()}원
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button variant="hero" size="lg" className="w-full" onClick={() => navigate('/auth')}>
                    <BookOpen className="w-5 h-5 mr-2" />
                    지금 수강하기
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/cart')}>
                    장바구니 담기
                  </Button>
                </div>

                {/* Additional Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => setIsWishlisted(!isWishlisted)}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isWishlisted ? 'fill-current text-destructive' : ''}`} />
                    찜하기
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    공유
                  </Button>
                </div>

                {/* Course Features */}
                <div className="border-t pt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>총 {course.duration} 강의</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Download className="w-4 h-4 text-muted-foreground" />
                    <span>모바일/PC 다운로드</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Award className="w-4 h-4 text-muted-foreground" />
                    <span>수료증 발급</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>평생 수강 가능</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CourseDetail;