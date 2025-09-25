import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import FeaturedCourses from "@/components/FeaturedCourses";
import SecondBanner from "@/components/SecondBanner";
import Footer from "@/components/Footer";
import InquiryButton from "@/components/InquiryButton";

const Index = () => {
  return (
    <div className="bg-background">
      <Header />
      <main>
        <HeroSection />
        <CategorySection />
        <FeaturedCourses />
        <SecondBanner />
      </main>
      <Footer />
      <InquiryButton />
    </div>
  );
};

export default Index;
