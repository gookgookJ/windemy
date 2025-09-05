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

  const recommendedCourses = [
    {
      id: 1,
      title: "LV1.내집마련 내집마련 하기 위한 쌤의 알아야 할 A to Z",
      instructor: "나나쌤의 내집마련 기초편",
      rating: 4.97,
      reviewCount: 82043,
      level: "오리지널",
      thumbnail: courseWebImg,
      tags: ["부동산", "내집", "코프닉", "똘똘한", "부..."]
    },
    {
      id: 2,
      title: "미래까지 1초만! 불당관례에서 동률한 한줄 고르는 방법",
      instructor: "미래까지 1초",
      rating: 4.94,
      reviewCount: 423,
      level: "오리지널",
      thumbnail: courseMarketingImg,
      tags: ["멤버서울볼쳐", "똘똘한"]
    },
    {
      id: 3,
      title: "1억에서 10억, 신혼부부를 위한 신혼부부 서울 내집마련",
      instructor: "신혼부부 서울",
      rating: 4.94,
      reviewCount: 423,
      level: "오리지널",
      thumbnail: courseWebImg,
      tags: ["멤버서울볼쳐"]
    },
    {
      id: 4,
      title: "12차 왕리더 미국주식 초보를 위한 고도로, 기초부터 백만원까지",
      instructor: "왕리더 미국주식",
      rating: 4.94,
      reviewCount: 423,
      level: "오리지널",
      thumbnail: courseMarketingImg,
      tags: ["멤버서울볼쳐"]
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              지금 가장 주목받는 강의
            </h2>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            더보기 →
          </button>
        </div>

        {/* Featured Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {recommendedCourses.map((course, index) => (
            <div key={course.id} className="group cursor-pointer">
              <div className="relative mb-4">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded">
                    {course.level}
                  </span>
                </div>
                <div className="absolute top-3 left-3">
                  <span className="bg-white text-foreground text-sm font-bold px-2 py-1 rounded shadow-md">
                    {index + 1}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-foreground line-clamp-2 leading-tight text-sm">
                  {course.title}
                </h3>
                
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-yellow-500">★</span>
                  <span className="font-semibold">{course.rating}</span>
                  <span className="text-muted-foreground">({course.reviewCount.toLocaleString()})</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {course.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              부동산부 인기강의
            </h2>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            내 결과는 인기강의 찾기 →
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourses;