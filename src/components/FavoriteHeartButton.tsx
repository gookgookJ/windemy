import { Heart } from "lucide-react";
import React from "react";

interface FavoriteHeartButtonProps {
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string; // allow extra positioning overrides if ever needed
  ariaLabelActive?: string;
  ariaLabelInactive?: string;
}

const FavoriteHeartButton: React.FC<FavoriteHeartButtonProps> = ({
  active,
  onClick,
  className = "",
  ariaLabelActive = "관심 강의에서 제거",
  ariaLabelInactive = "관심 강의에 추가",
}) => {
  return (
    <button
      onClick={onClick}
      className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110 z-10 touch-target flex items-center justify-center ${className}`}
      aria-label={active ? ariaLabelActive : ariaLabelInactive}
    >
      <Heart
        className={`w-4 h-4 transition-all duration-200 ${
          active ? "text-red-500 fill-red-500" : "text-gray-400 hover:text-red-400"
        }`}
      />
    </button>
  );
};

export default FavoriteHeartButton;
