import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import FeaturedCourses from "@/components/FeaturedCourses";
import SecondBanner from "@/components/SecondBanner";
import Footer from "@/components/Footer";
import { useHomepageData } from "@/hooks/queries/useHomepageData";

const Index = () => {
  const { data: homepageData, isLoading, error } = useHomepageData();

  if (error) {
    console.error('Homepage data error:', error);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection heroSlides={homepageData?.heroSlides} />
        <CategorySection />
        <FeaturedCourses />
        <SecondBanner />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
