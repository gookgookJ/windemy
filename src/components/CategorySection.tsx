import { Link } from "react-router-dom";
import { memo } from "react";
import freeCoursesIcon from "@/assets/icons/free-courses-icon.png";
import premiumIcon from "@/assets/icons/premium-icon.png";
import vodIcon from "@/assets/icons/vod-icon.png";
import chatIcon from "@/assets/icons/chat-icon.png";
import youtubeIcon from "@/assets/icons/youtube-icon.png";
import blogIcon from "@/assets/icons/blog-icon.png";

const CategorySection = memo(() => {
  const categories = [
    { 
      icon: freeCoursesIcon, 
      label: "무료", 
      color: "bg-blue-100",
      link: "/courses/free-courses",
      isExternal: false
    },
    { 
      icon: premiumIcon, 
      label: "프리미엄", 
      color: "bg-purple-100",
      link: "/courses/premium-courses",
      isExternal: false
    },
    { 
      icon: vodIcon, 
      label: "VOD", 
      color: "bg-red-100",
      link: "/courses/vod-courses",
      isExternal: false
    },
    { 
      icon: chatIcon, 
      label: "1:1문의", 
      color: "bg-green-100",
      link: "channeltalk",
      isExternal: false
    },
    { 
      icon: youtubeIcon, 
      label: "유튜브", 
      color: "bg-red-100",
      link: "https://www.youtube.com/@windly",
      isExternal: true
    },
    { 
      icon: blogIcon, 
      label: "블로그", 
      color: "bg-orange-100",
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
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl ${category.color} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-105 transition-transform duration-200 p-2`}>
                  <img 
                    src={category.icon} 
                    alt={category.label}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground text-center">
                  {category.label}
                </span>
              </div>
            );

            if (category.link === "channeltalk") {
              return (
                <div
                  key={index}
                  className="block cursor-pointer"
                  onClick={() => {
                    if (window.ChannelIO) {
                      window.ChannelIO('showMessenger');
                    }
                  }}
                >
                  {content}
                </div>
              );
            }

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