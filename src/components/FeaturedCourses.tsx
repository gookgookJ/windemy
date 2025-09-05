import { ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import CourseCard from "./CourseCard";
import courseWebImg from "@/assets/course-web.jpg";
import courseMarketingImg from "@/assets/course-marketing.jpg";

const FeaturedCourses = () => {
  const featuredCourses = [
    {
      id: "1",
      title: "실무에 바로 적용하는 React.js 완전정복",
      instructor: "김개발",
      thumbnail: courseWebImg,
      price: 89000,
      originalPrice: 120000,
      rating: 4.9,
      reviewCount: 1250,
      duration: "32시간",
      studentCount: 15000,
      level: "intermediate" as const,
      category: "개발/프로그래밍",
      isHot: true,
    },
    {
      id: "2",
      title: "디지털 마케팅 전략과 실전 캠페인 기획",
      instructor: "박마케터",
      thumbnail: courseMarketingImg,
      price: 75000,
      originalPrice: 95000,
      rating: 4.8,
      reviewCount: 980,
      duration: "24시간",
      studentCount: 8500,
      level: "beginner" as const,
      category: "마케팅",
      isNew: true,
    },
    {
      id: "3",
      title: "Next.js와 TypeScript로 만드는 풀스택 웹 애플리케이션",
      instructor: "이풀스택",
      thumbnail: courseWebImg,
      price: 125000,
      originalPrice: 150000,
      rating: 4.9,
      reviewCount: 756,
      duration: "48시간",
      studentCount: 5200,
      level: "advanced" as const,
      category: "개발/프로그래밍",
      isHot: true,
    },
    {
      id: "4",
      title: "데이터 분석을 통한 마케팅 ROI 최적화",
      instructor: "최분석가",
      thumbnail: courseMarketingImg,
      price: 99000,
      rating: 4.7,
      reviewCount: 432,
      duration: "28시간",
      studentCount: 3800,
      level: "intermediate" as const,
      category: "마케팅",
    },
  ];

  const categories = [
    { name: "개발/프로그래밍", count: 450, color: "from-blue-500 to-purple-600" },
    { name: "마케팅", count: 320, color: "from-green-500 to-blue-500" },
    { name: "디자인", count: 280, color: "from-purple-500 to-pink-500" },
    { name: "비즈니스", count: 380, color: "from-orange-500 to-red-500" },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-primary" />
            <span className="text-primary font-semibold">인기 강의</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
            지금 가장 인기 있는 강의들
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            실무 전문가들이 직접 제작한 고품질 강의로 여러분의 실력을 한 단계 업그레이드하세요
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {categories.map((category, index) => (
            <div
              key={index}
              className="group cursor-pointer p-6 rounded-2xl bg-white shadow-soft hover:shadow-strong transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${category.color} mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-white font-bold text-xl">
                  {category.name.charAt(0)}
                </span>
              </div>
              <h3 className="font-bold text-foreground text-lg mb-2">{category.name}</h3>
              <p className="text-muted-foreground text-sm">{category.count}개 강의</p>
            </div>
          ))}
        </div>

        {/* Featured Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {featuredCourses.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button variant="outline" size="lg" className="group border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary">
            전체 강의 보기
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Success Stories */}
        <div className="mt-20 bg-gradient-to-r from-primary-light to-secondary-light rounded-3xl p-8 lg:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
              수강생들의 성공 스토리
            </h3>
            <p className="text-muted-foreground text-lg">
              LearnHub에서 꿈을 이룬 수강생들의 이야기를 들어보세요
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "김철수",
                role: "프론트엔드 개발자 취업 성공",
                story: "React 강의 수강 후 3개월 만에 원하던 IT 회사에 취업했어요!",
                course: "React.js 완전정복",
              },
              {
                name: "박영희",
                role: "마케팅 팀장 승진",
                story: "디지털 마케팅 강의로 실무 역량을 키워 팀장으로 승진했습니다.",
                course: "디지털 마케팅 전략",
              },
              {
                name: "이민수",
                role: "창업 성공",
                story: "비즈니스 강의를 통해 아이디어를 구체화하여 스타트업을 창업했어요!",
                course: "비즈니스 전략 기획",
              },
            ].map((story, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300"
              >
                <div className="mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mb-3">
                    <span className="text-white font-bold">
                      {story.name.charAt(0)}
                    </span>
                  </div>
                  <h4 className="font-bold text-foreground">{story.name}</h4>
                  <p className="text-primary text-sm font-medium">{story.role}</p>
                </div>
                <p className="text-muted-foreground mb-3 leading-relaxed">
                  "{story.story}"
                </p>
                <p className="text-xs text-muted-foreground">
                  수강 강의: {story.course}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourses;