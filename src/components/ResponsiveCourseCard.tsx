import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, User, PlayCircle } from 'lucide-react';

interface EnrollmentWithCourse {
  id: string;
  progress: number;
  enrolled_at: string;
  completed_at: string | null;
  course: {
    id: string;
    title: string;
    thumbnail_url: string;
    duration_hours: number;
    instructor: {
      full_name: string;
    };
  };
}

interface ResponsiveCourseCardProps {
  enrollment: EnrollmentWithCourse;
  onClick: () => void;
}

const ResponsiveCourseCard = ({ enrollment, onClick }: ResponsiveCourseCardProps) => {
  const progressPercentage = Math.round(enrollment.progress);
  const isCompleted = enrollment.completed_at || enrollment.progress >= 100;

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-1"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* 모바일 레이아웃 */}
        <div className="block sm:hidden">
          <div className="relative">
            <img
              src={enrollment.course.thumbnail_url || '/placeholder.svg'}
              alt={enrollment.course.title}
              className="w-full h-48 object-cover rounded-t-lg"
            />
            {isCompleted && (
              <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600">
                완료
              </Badge>
            )}
            <div className="absolute bottom-3 left-3 right-3">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2">
                <div className="flex justify-between text-white text-xs mb-1">
                  <span>진도율</span>
                  <span className="font-medium">{progressPercentage}%</span>
                </div>
                <Progress value={enrollment.progress} className="h-1.5 bg-white/20" />
              </div>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            <h3 className="font-semibold text-base leading-tight line-clamp-2">
              {enrollment.course.title}
            </h3>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate">{enrollment.course.instructor?.full_name}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Clock className="h-3 w-3" />
                <span>{enrollment.course.duration_hours}시간</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {isCompleted ? '다시 보기' : '학습 계속하기'}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* 태블릿/데스크톱 레이아웃 */}
        <div className="hidden sm:block">
          <div className="flex gap-4 p-4">
            <div className="relative flex-shrink-0">
              <img
                src={enrollment.course.thumbnail_url || '/placeholder.svg'}
                alt={enrollment.course.title}
                className="w-32 h-20 sm:w-40 sm:h-24 lg:w-48 lg:h-28 object-cover rounded-lg"
              />
              {isCompleted && (
                <Badge className="absolute -top-2 -right-2 bg-green-500 hover:bg-green-600 text-xs">
                  완료
                </Badge>
              )}
            </div>
            
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold text-base lg:text-lg leading-tight line-clamp-2">
                  {enrollment.course.title}
                </h3>
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>강사: {enrollment.course.instructor?.full_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>총 {enrollment.course.duration_hours}시간</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">학습 진도</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{progressPercentage}%</span>
                    {isCompleted && (
                      <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                        완료
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress value={enrollment.progress} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResponsiveCourseCard;