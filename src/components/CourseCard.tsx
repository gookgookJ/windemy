import { Star, Clock, Users, BookOpen, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";

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
      <div className="relative overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-[160px] sm:h-[180px] object-cover transition-transform duration-300 group-hover:scale-105 responsive-image"
        />
        {/* Favorite Heart Button - 하트는 크게, 원형 테두리는 얇고 작게 (모바일 기준 1.5배) */}
        <button
          onClick={handleFavoriteClick}
          className="absolute bottom-1 right-1 w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full border border-border bg-transparent hover:bg-accent/40 transition-colors duration-200 shadow-sm flex items-center justify-center"
          aria-label={isFavorite(id) ? "관심 강의에서 제거" : "관심 강의에 추가"}
        >
          <Heart 
            className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 transition-all duration-200 ${
              isFavorite(id) 
                ? 'text-red-500 fill-red-500' 
                : 'text-gray-500'
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
        <div className="flex flex-wrap gap-2">
          {isHot && (
            <Badge className="bg-red-500 text-white font-medium text-xs px-2 py-1">
              BEST
            </Badge>
          )}
          {isNew && (
            <Badge className="bg-green-500 text-white font-medium text-xs px-2 py-1">
              NEW
            </Badge>
          )}
          {price === 0 && (
            <Badge className="bg-blue-500 text-white font-medium text-xs px-2 py-1">
              무료
            </Badge>
          )}
          <Badge 
            variant="outline" 
            className={`text-xs px-2 py-1 ${
              level === "beginner" ? "border-green-500 text-green-600" :
              level === "intermediate" ? "border-yellow-500 text-yellow-600" :
              "border-red-500 text-red-600"
            }`}
          >
            {level === "beginner" ? "초급" : level === "intermediate" ? "중급" : "고급"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;