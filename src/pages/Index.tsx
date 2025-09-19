import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import FeaturedCourses from "@/components/FeaturedCourses";
import Footer from "@/components/Footer";
import { BlogUpdateTester } from "@/components/BlogUpdateTester";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <CategorySection />
        <FeaturedCourses />
        
        {/* 임시 테스터 - 추후 제거 예정 */}
        <div className="py-8 px-4">
          <BlogUpdateTester />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
