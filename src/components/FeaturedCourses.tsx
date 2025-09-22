import { memo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Zap, Heart, Crown, Monitor, BookOpen, Target } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/contexts/FavoritesContext";
import InfoBanner from "@/components/InfoBanner";
import { getOptimizedImageForContext } from "@/utils/imageOptimization";
import { useFeaturedCourses } from "@/hooks/queries/useFeaturedCourses";

interface Course {
  id: string;
  title: string;
  instructor_name?: string;
  instructor_id?: string;
  thumbnail_url?: string;
  price: number;
  rating?: number;
  total_students?: number;
  duration_hours?: number;
  level?: string;
  category?: string;
  is_hot?: boolean;
  is_new?: boolean;
  short_description?: string;
}

interface HomepageSection {
  id: string;
  title: string;
  subtitle?: string;
  icon_type: 'emoji' | 'lucide' | 'custom';
  icon_value: string;
  filter_type: 'manual' | 'category' | 'tag' | 'hot_new';
  filter_value?: string;
  display_limit: number;
  order_index: number;
  is_active: boolean;
  section_type: string;
}

interface Category {
  id: string;
  name: string;
  course_count: number;
}

const FeaturedCourses = memo(() => {
  const { data, isLoading: loading, error } = useFeaturedCourses();
  const sections = data?.sections || [];
  const sectionCourses = data?.sectionCourses || {};

  if (error) {
    console.error('Error fetching featured courses:', error);
  }

  // 기본 부제목 제공 함수
  const getDefaultSubtitle = (section: HomepageSection) => {
    switch (section.section_type) {
      case 'free':
        return '이커머스가 처음이라면? 무료강의부터';
      case 'premium':
        return '상위 1% 셀러들의 핵심 노하우';
      case 'vod':
        return '언제 어디서나 자유롭게 학습';
      case 'custom':
        return '엄선된 강의로 여러분의 성장을 도와드립니다';
      default:
        if (section.filter_type === 'hot_new') {
          return '많은 셀러가 주목하는 인기 강의';
        } else if (section.filter_type === 'category') {
          return `${section.filter_value} 분야의 전문 강의를 만나보세요`;
        }
        return '많은 셀러가 주목하는 인기 강의';
    }
  };

  const CourseCarousel = ({ courses, title, subtitle, viewAllLink, icon, section }: {
    courses: Course[], 
    title: string, 
    subtitle?: string,
    viewAllLink: string,
    icon?: React.ReactNode,
    section: HomepageSection
  }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ 
      align: 'start',
      slidesToScroll: 1,
      loop: false
    });

    const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
    const scrollNext = () => emblaApi && emblaApi.scrollNext();


    // Show only first 4 courses initially, rest in carousel
    const displayCourses = courses.slice(0, Math.min(courses.length, 8));

    return (
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="min-h-[4rem] sm:min-h-[4.5rem] lg:min-h-[5rem] flex flex-col justify-center">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                {title}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 leading-relaxed">
                {subtitle || getDefaultSubtitle(section)}
              </p>
            </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* 모든 섹션에 캐러셀 컨트롤 표시 */}
            {courses.length > 1 && (
              <div className="hidden sm:flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollPrev}
                  className="h-8 w-8 sm:h-10 sm:w-10 touch-target"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollNext}
                  className="h-8 w-8 sm:h-10 sm:w-10 touch-target"
                >
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            )}
            <Link 
              to={viewAllLink}
              className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors touch-target"
            >
              더보기 →
            </Link>
          </div>
        </div>

        {/* 모든 섹션을 캐러셀로 표시 */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3 sm:gap-4">
            {displayCourses.map((course, index) => (
              <div key={course.id} className="flex-none w-[calc(70%-12px)] sm:w-[calc(40%-6px)] md:w-[calc(40%-8px)] lg:w-[calc(28.5%-14px)]">
                <CourseCard course={course} index={index} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getIconComponent = (section: HomepageSection) => {
    if (section.icon_type === 'emoji') {
      return <span className="text-2xl">{section.icon_value}</span>;
    } else if (section.icon_type === 'lucide') {
      const iconMap: Record<string, React.ComponentType<any>> = {
        Zap,
        Crown,
        Monitor,
        BookOpen,
        Target
      };
      const IconComponent = iconMap[section.icon_value] || BookOpen;
      return <IconComponent className="w-7 h-7 text-blue-500" />;
    }
    return <span className="text-2xl">📚</span>;
  };

  const CourseCard = ({ course, index }: { course: Course, index: number }) => {
    const { toggleFavorite, isFavorite } = useFavorites();

    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(course.id);
  };


    return (
      <Link to={`/course/${course.id}`} className="group cursor-pointer block">
        <div 
          className="relative mb-4 bg-muted/50 aspect-[16/9] lg:aspect-[16/9] overflow-hidden rounded-xl"
          data-image-container
        >
          <img
            src={getOptimizedImageForContext(course.thumbnail_url, 'course-card')}
            alt={course.title}
            className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
            loading={index < 4 ? "eager" : "lazy"}
            fetchPriority={index < 4 ? "high" : "auto"}
            sizes="(max-width: 640px) 40vw, (max-width: 1024px) 33vw, 25vw"
            width="320"
            height="180"
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              const container = img.closest('[data-image-container]') as HTMLElement;
              // Only adjust aspect ratio for mobile/tablet (below lg breakpoint)
              if (container && img.naturalWidth && img.naturalHeight && window.innerWidth < 1024) {
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                container.style.aspectRatio = aspectRatio.toString();
              }
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              requestAnimationFrame(() => {
                target.src = "/placeholder.svg";
              });
            }}
          />
          
          {/* Favorite Heart Button - 원 크기를 하트의 1.5배로 축소 */}
          <button
            onClick={handleFavoriteClick}
            className="absolute bottom-1 right-1 w-2.5 h-2.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md hover:scale-110 z-10 touch-target flex items-center justify-center"
            aria-label={isFavorite(course.id) ? "관심 강의에서 제거" : "관심 강의에 추가"}
          >
            <Heart 
              className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 transition-all duration-200 ${
                isFavorite(course.id) 
                  ? 'text-red-500 fill-red-500' 
                  : 'text-gray-400 hover:text-red-400'
              }`}
            />
          </button>

          {/* Tags */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1">
            {course.is_hot && (
              <span className="bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                HOT
              </span>
            )}
            {course.is_new && (
              <span className="bg-green-500 text-white text-xs font-semibold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                NEW
              </span>
            )}
          </div>
        </div>
        
        <div className="space-y-2 sm:space-y-3">
          <h3 className="font-bold text-sm sm:text-base text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          
          {course.instructor_name && 
           course.instructor_name !== "운영진" && 
           course.instructor_name !== "강사" && (
            <div className="text-xs sm:text-sm text-muted-foreground">
              {course.instructor_name}
            </div>
          )}
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-48 bg-muted rounded-xl"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Compute split so InfoBanner can be full-width between sections
  const sectionsWithCourses = sections.filter((s) => (sectionCourses[s.id] || []).length > 0);
  const splitIdx = sectionsWithCourses.findIndex((s) => (s.title || '').includes('무료'));
  const hasSplit = splitIdx !== -1 && splitIdx < sectionsWithCourses.length - 1;

  if (!hasSplit) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {sectionsWithCourses.map((section) => (
            <CourseCarousel
              key={section.id}
              courses={sectionCourses[section.id] || []}
              title={section.title}
              subtitle={section.subtitle}
              viewAllLink="/courses"
              icon={getIconComponent(section)}
              section={section}
            />
          ))}

          {sections.length === 0 && !loading && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">강의 섹션이 없습니다</h3>
              <p className="text-muted-foreground">관리자 페이지에서 메인 페이지 섹션을 설정해주세요.</p>
            </div>
          )}
        </div>
      </section>
    );
  }

  const firstPart = sectionsWithCourses.slice(0, splitIdx + 1);
  const secondPart = sectionsWithCourses.slice(splitIdx + 1);

  return (
    <>
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {firstPart.map((section) => (
            <CourseCarousel
              key={section.id}
              courses={sectionCourses[section.id] || []}
              title={section.title}
              subtitle={section.subtitle}
              viewAllLink="/courses"
              icon={getIconComponent(section)}
              section={section}
            />
          ))}
        </div>
      </section>

      {/* Full-width banner between sections */}
      <InfoBanner />

      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {secondPart.map((section) => (
            <CourseCarousel
              key={section.id}
              courses={sectionCourses[section.id] || []}
              title={section.title}
              subtitle={section.subtitle}
              viewAllLink="/courses"
              icon={getIconComponent(section)}
              section={section}
            />
          ))}
        </div>
      </section>
    </>
  );
});

FeaturedCourses.displayName = 'FeaturedCourses';

export default FeaturedCourses;