import { Star, Clock, Users, BookOpen, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/contexts/FavoritesContext";
import { getOptimizedImageForContext } from "@/utils/imageOptimization";

interface CourseCardProps {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  duration: string;
  studentCount: number;
  level: "beginner" | "intermediate" | "advanced";
  category: string;
  isHot?: boolean;
  isNew?: boolean;
  priority?: boolean; // Add priority prop for LCP optimization
}

const CourseCard = ({
  id,
  title,
  instructor,
  thumbnail,
  price,
  originalPrice,
  rating,
  reviewCount,
  duration,
  studentCount,
  level,
  category,
  isHot,
  isNew,
  priority = false,
}: CourseCardProps) => {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking heart
    toggleFavorite(id);
  };

  const handleCardClick = () => {
    navigate(`/course/${id}`);
  };

  return (
    <Card 
      className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 bg-white w-full max-w-[380px] touch-target"
      onClick={handleCardClick}
    >
      <div 
        className="relative overflow-hidden bg-muted/50 aspect-[16/9] lg:aspect-[16/9]" 
        data-image-container
      >
        <img
          src={getOptimizedImageForContext(thumbnail, 'course-card')}
          alt={title}
          className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          sizes="(max-width: 375px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1440px) 25vw, 20vw"
          width="380"
          height="214"
          decoding={priority ? "sync" : "async"}
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            const container = img.closest('[data-image-container]') as HTMLElement;
            // Only adjust aspect ratio for mobile/tablet (below lg breakpoint)
            if (container && img.naturalWidth && img.naturalHeight && window.innerWidth < 1024) {
              const aspectRatio = img.naturalWidth / img.naturalHeight;
              container.style.aspectRatio = aspectRatio.toString();
            }
          }}
        />
        {/* Favorite Heart Button - 원 크기를 하트의 1.5배로 축소 */}
        <button
          onClick={handleFavoriteClick}
          className="absolute bottom-1 right-1 w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md hover:scale-110 touch-target flex items-center justify-center"
          aria-label={isFavorite(id) ? "관심 강의에서 제거" : "관심 강의에 추가"}
        >
          <Heart 
            className={`w-2 h-2 sm:w-4 sm:h-4 transition-all duration-200 ${
              isFavorite(id) 
                ? 'text-red-500 fill-red-500' 
                : 'text-gray-400 hover:text-red-400'
            }`}
          />
        </button>
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-bold text-base text-foreground mb-2 line-clamp-2 leading-tight hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Rating & Reviews */}
        <div className="flex items-center gap-1 mb-3 text-sm">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
          <span className="text-muted-foreground">({reviewCount})</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {/* Random promotional tags */}
          {(() => {
            const promoTags = ["얼리버드", "신규", "인기", "30명한정"];
            const randomCount = Math.floor(Math.random() * 3) + 1; // 1-3 tags
            const shuffled = [...promoTags].sort(() => 0.5 - Math.random());
            const selectedTags = shuffled.slice(0, randomCount);
            
            return selectedTags.map(tag => (
              <Badge 
                key={tag}
                className="bg-gradient-to-r from-primary/90 to-primary text-white font-medium text-[10px] px-1.5 py-0.5 rounded-sm border-0"
              >
                {tag}
              </Badge>
            ));
          })()}
          
          {isHot && (
            <Badge className="bg-red-500 text-white font-medium text-[10px] px-1.5 py-0.5 rounded-sm border-0">
              BEST
            </Badge>
          )}
          {isNew && (
            <Badge className="bg-green-500 text-white font-medium text-[10px] px-1.5 py-0.5 rounded-sm border-0">
              NEW
            </Badge>
          )}
          {price === 0 && (
            <Badge className="bg-blue-500 text-white font-medium text-[10px] px-1.5 py-0.5 rounded-sm border-0">
              무료
            </Badge>
          )}
          <Badge 
            variant="outline" 
            className={`text-[10px] px-1.5 py-0.5 rounded-sm border font-medium ${
              level === "beginner" ? "border-green-500/60 text-green-600 bg-green-50" :
              level === "intermediate" ? "border-yellow-500/60 text-yellow-600 bg-yellow-50" :
              "border-red-500/60 text-red-600 bg-red-50"
            }`}
          >
            {level === "beginner" ? "Lv1" : level === "intermediate" ? "Lv2" : "Lv3"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;