import { Star, Clock, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

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
  const discountRate = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const levelConfig = {
    beginner: { text: "초급", color: "bg-level-beginner" },
    intermediate: { text: "중급", color: "bg-level-intermediate" },
    advanced: { text: "고급", color: "bg-level-advanced" },
  };

  return (
    <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 bg-white">
      <div className="relative overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
          style={{ width: '272.33px', height: '153.17px' }}
        />
      </div>

      <CardContent className="p-4" onClick={() => navigate(`/course/${id}`)}>
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
        <div className="flex flex-wrap gap-2 mb-3">
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

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            {price === 0 ? (
              <span className="text-lg font-bold text-green-600">무료</span>
            ) : (
              <>
                <span className="text-lg font-bold text-foreground">
                  {price.toLocaleString()}원
                </span>
                {originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {originalPrice.toLocaleString()}원
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;