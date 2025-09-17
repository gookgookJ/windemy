import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import FeaturedCourses from "@/components/FeaturedCourses";
import InfoBanner from "@/components/InfoBanner";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <CategorySection />
        <FeaturedCourses filterSections={["⚡ 무료로 배우는 이커머스"]} />
        <InfoBanner />
        <FeaturedCourses filterSections={["👑 프리미엄 강의"]} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
