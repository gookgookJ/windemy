import { 
  BookOpen, 
  Crown, 
  Play, 
  MessageCircle, 
  Youtube,
  FileText,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";

const CategorySection = () => {
  const categories = [
    { 
      icon: BookOpen, 
      label: "무료강의", 
      color: "bg-blue-100 text-blue-600",
      link: "/courses?type=free",
      isExternal: false
    },
    { 
      icon: Crown, 
      label: "프리미엄 강의", 
      color: "bg-purple-100 text-purple-600",
      link: "/courses?type=premium",
      isExternal: false
    },
    { 
      icon: Play, 
      label: "VOD", 
      color: "bg-red-100 text-red-600",
      link: "/courses?type=vod",
      isExternal: false
    },
    { 
      icon: MessageCircle, 
      label: "1:1문의", 
      color: "bg-green-100 text-green-600",
      link: "https://windemy.channel.io/home",
      isExternal: true
    },
    { 
      icon: Youtube, 
      label: "유튜브", 
      color: "bg-red-100 text-red-600",
      link: "https://www.youtube.com/@windly",
      isExternal: true
    },
    { 
      icon: FileText, 
      label: "블로그", 
      color: "bg-orange-100 text-orange-600",
      link: "https://www.windly.cc/blog",
      isExternal: true
    },
    { 
      icon: Users, 
      label: "커뮤니티", 
      color: "bg-cyan-100 text-cyan-600",
      link: "/community",
      isExternal: false
    },
  ];

  const handleCategoryClick = (category: typeof categories[0]) => {
    if (category.isExternal) {
      window.open(category.link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section className="py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-6">
          {categories.map((category, index) => {
            const content = (
              <div className="flex flex-col items-center group cursor-pointer">
                <div className={`w-16 h-16 rounded-2xl ${category.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200`}>
                  <category.icon className="w-8 h-8" />
                </div>
                <span className="text-sm font-medium text-foreground text-center">
                  {category.label}
                </span>
              </div>
            );

            return category.isExternal ? (
              <div key={index} onClick={() => handleCategoryClick(category)}>
                {content}
              </div>
            ) : (
              <Link key={index} to={category.link}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;