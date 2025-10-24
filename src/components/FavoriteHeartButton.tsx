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
      className={`absolute top-0 -right-1 sm:-right-1.5 md:-right-2 lg:-right-2.5 transition-all duration-200 hover:scale-110 z-10 touch-target ${className}`}
      aria-label={active ? ariaLabelActive : ariaLabelInactive}
    >
      <Heart
        className={`w-4 h-4 sm:w-4 md:w-5 lg:w-5 transition-all duration-200 drop-shadow-sm ${
          active 
            ? "text-red-500 fill-red-500 stroke-red-500 stroke-[1.5]" 
            : "text-transparent fill-transparent stroke-white stroke-[1.5]"
        }`}
      />
    </button>
  );
};

export default FavoriteHeartButton;
