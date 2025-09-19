import { 
  BookOpen, 
  Crown, 
  Play, 
  MessageCircle, 
  Youtube,
  FileText
} from "lucide-react";
import { Link } from "react-router-dom";
import { memo } from "react";

const CategorySection = memo(() => {
  const categories = [
    { 
      icon: BookOpen, 
      label: "무료강의", 
      color: "bg-blue-100 text-blue-600",
      link: "/courses/free-courses",
      isExternal: false
    },
    { 
      icon: Crown, 
      label: "프리미엄 강의", 
      color: "bg-purple-100 text-purple-600",
      link: "/courses/premium-courses",
      isExternal: false
    },
    { 
      icon: Play, 
      label: "VOD", 
      color: "bg-red-100 text-red-600",
      link: "/courses/vod-courses",
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
  ];

  return (
    <section className="py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {categories.map((category, index) => {
            const content = (
              <div className="flex flex-col items-center group cursor-pointer touch-target">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl ${category.color} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-105 transition-transform duration-200`}>
                  <category.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${category.label === '유튜브' ? 'flex-shrink-0' : ''}`} />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground text-center">
                  {category.label}
                </span>
              </div>
            );

            return category.isExternal ? (
              <a
                key={index}
                href={category.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {content}
              </a>
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
});

CategorySection.displayName = 'CategorySection';

export default CategorySection;