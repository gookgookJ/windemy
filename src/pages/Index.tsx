import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import FeaturedCourses from "@/components/FeaturedCourses";
import SecondBanner from "@/components/SecondBanner";
import Footer from "@/components/Footer";
import { BlogUpdateTester } from "@/components/BlogUpdateTester";

const Index = () => {
  return (
    <div className="bg-background">
      <Header />
      <main>
        <HeroSection />
        <CategorySection />
        <FeaturedCourses />
        <SecondBanner />
        <div className="container mx-auto py-8">
          <BlogUpdateTester />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
