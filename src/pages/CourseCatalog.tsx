import { useState } from "react";
import { Filter, Search, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import courseWebImg from "@/assets/course-web.jpg";
import courseMarketingImg from "@/assets/course-marketing.jpg";

const CourseCatalog = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const courses = [
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
  ];

  const categories = [
    { id: "all", name: "전체", count: 2000 },
    { id: "development", name: "개발/프로그래밍", count: 450 },
    { id: "marketing", name: "마케팅", count: 320 },
    { id: "design", name: "디자인", count: 280 },
    { id: "business", name: "비즈니스", count: 380 },
  ];

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
            {/* Search and View Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="강의를 검색해보세요"
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Course Grid */}
            <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
              {courses.map((course) => (
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