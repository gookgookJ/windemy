import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import FeaturedCourses from "@/components/FeaturedCourses";
import SecondBanner from "@/components/SecondBanner";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <CategorySection />
        <FeaturedCourses />
        <SecondBanner />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
