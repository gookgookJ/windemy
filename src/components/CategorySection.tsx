import { Link } from "react-router-dom";
import { memo } from "react";
import freeCoursesIcon from "@/assets/icons/free-courses-icon.png";
import premiumIcon from "@/assets/icons/premium-icon.png";
import vodIcon from "@/assets/icons/vod-icon.png";
import chatIcon from "@/assets/icons/chat-icon.png";
import announcementIcon from "@/assets/icons/announcement-icon.png";
import blogIcon from "@/assets/icons/blog-icon.png";
import couponIcon from "@/assets/icons/coupon-icon.png";
import cafeIcon from "@/assets/icons/cafe-icon.png";

const CategorySection = memo(() => {
  const categories = [
    { 
      icon: freeCoursesIcon, 
      label: "무료", 
      link: "/courses/free-courses",
      isExternal: false
    },
    { 
      icon: premiumIcon, 
      label: "프리미엄", 
      link: "/courses/premium-courses",
      isExternal: false
    },
    { 
      icon: vodIcon, 
      label: "VOD", 
      link: "/courses/vod-courses",
      isExternal: false
    },
    { 
      icon: chatIcon, 
      label: "1:1문의", 
      link: "channeltalk",
      isExternal: false
    },
    { 
      icon: announcementIcon, 
      label: "공지사항", 
      link: "/announcements",
      isExternal: false
    },
    { 
      icon: blogIcon, 
      label: "블로그", 
      link: "https://www.windly.cc/blog",
      isExternal: true
    },
    { 
      icon: couponIcon, 
      label: "내 쿠폰", 
      link: "/my-rewards",
      isExternal: false
    },
    { 
      icon: cafeIcon, 
      label: "네이버 카페", 
      link: "https://cafe.naver.com/windly",
      isExternal: true
    },
  ];

  return (
    <section className="py-12 bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:flex lg:justify-between gap-x-1 gap-y-6 sm:gap-x-1.5 sm:gap-y-6 lg:gap-0.5">
          {categories.map((category, index) => {
            const content = (
              <div className="flex flex-col items-center group cursor-pointer touch-target flex-1 min-w-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl bg-muted/30 border border-muted-foreground/10 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-105 transition-transform duration-200 p-3">
                  <img 
                    src={category.icon} 
                    alt={category.label}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground text-center whitespace-nowrap">
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