import { Star, Clock, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
  const discountRate = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const levelConfig = {
    beginner: { text: "초급", color: "bg-level-beginner" },
    intermediate: { text: "중급", color: "bg-level-intermediate" },
    advanced: { text: "고급", color: "bg-level-advanced" },
  };

  return (
    <Card className="group cursor-pointer overflow-hidden border-0 shadow-soft hover:shadow-strong transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-b from-white to-muted/30">
      <div className="relative overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isHot && (
            <Badge className="bg-destructive text-destructive-foreground font-bold">
              🔥 인기
            </Badge>
          )}
          {isNew && (
            <Badge className="bg-success text-success-foreground font-bold">
              ✨ 신규
            </Badge>
          )}
          {discountRate > 0 && (
            <Badge className="bg-warning text-warning-foreground font-bold">
              {discountRate}% 할인
            </Badge>
          )}
        </div>

        {/* Level Badge */}
        <div className="absolute top-3 right-3">
          <Badge className={`${levelConfig[level].color} text-white font-medium`}>
            {levelConfig[level].text}
          </Badge>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button variant="hero" size="lg" className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            강의 보기
          </Button>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Category */}
        <div className="mb-2">
          <span className="text-sm text-primary font-medium">{category}</span>
        </div>

        {/* Title & Instructor */}
        <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 leading-tight">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4">{instructor}</p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-warning fill-current" />
            <span className="font-medium text-foreground">{rating}</span>
            <span>({reviewCount.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{studentCount.toLocaleString()}명</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">
              {price.toLocaleString()}원
            </span>
            {originalPrice && (
              <span className="text-muted-foreground line-through text-sm">
                {originalPrice.toLocaleString()}원
              </span>
            )}
          </div>
          <Button variant="outline" size="sm" className="hover:border-primary hover:text-primary">
            <BookOpen className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;