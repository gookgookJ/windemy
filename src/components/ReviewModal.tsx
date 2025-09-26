import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Send, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

interface ReviewModalProps {
  courseId: string;
  courseTitle: string;
  trigger: React.ReactNode;
  existingReview?: {
    id: string;
    rating: number;
    review_text: string;
  } | null;
  onReviewSubmitted?: () => void;
}

const reviewSchema = z.object({
  rating: z.number().min(1, "평점을 선택해주세요").max(5, "평점은 1-5점 사이여야 합니다"),
  review_text: z.string()
    .trim()
    .min(10, "후기는 최소 10자 이상 작성해주세요")
    .max(1000, "후기는 1000자 이하로 작성해주세요")
});

const ReviewModal = ({ courseId, courseTitle, trigger, existingReview, onReviewSubmitted }: ReviewModalProps) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [reviewText, setReviewText] = useState(existingReview?.review_text || '');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setReviewText(existingReview.review_text);
    }
  }, [existingReview]);

  const validateForm = () => {
    try {
      reviewSchema.parse({ rating, review_text: reviewText });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMap: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errorMap[err.path[0] as string] = err.message;
          }
        });
        setErrors(errorMap);
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!user || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const reviewData = {
        user_id: user.id,
        course_id: courseId,
        rating,
        review_text: reviewText.trim(),
      };

      let result;
      if (existingReview) {
        // 기존 후기 수정
        result = await supabase
          .from('course_reviews')
          .update(reviewData)
          .eq('id', existingReview.id)
          .select()
          .single();
      } else {
        // 새 후기 작성
        result = await supabase
          .from('course_reviews')
          .insert(reviewData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: "후기 " + (existingReview ? "수정" : "작성") + " 완료! ⭐",
        description: `${rating}점의 소중한 후기를 남겨주셔서 감사합니다.`,
      });

      setOpen(false);
      onReviewSubmitted?.();
      
      // 폼 초기화 (새 후기 작성시에만)
      if (!existingReview) {
        setRating(0);
        setReviewText('');
      }

    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "후기 " + (existingReview ? "수정" : "작성") + " 실패",
        description: error.message || "다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (interactive = true) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const isActive = interactive 
        ? (hoveredStar >= starValue || (hoveredStar === 0 && rating >= starValue))
        : rating >= starValue;

      return (
        <button
          key={starValue}
          type="button"
          disabled={!interactive}
          className={`transition-all duration-200 ${interactive ? 'hover:scale-110' : ''}`}
          onMouseEnter={() => interactive && setHoveredStar(starValue)}
          onMouseLeave={() => interactive && setHoveredStar(0)}
          onClick={() => interactive && setRating(starValue)}
        >
          <Star
            className={`h-8 w-8 ${
              isActive 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            } transition-colors duration-200`}
          />
        </button>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {existingReview ? <Edit3 className="h-5 w-5" /> : <Star className="h-5 w-5" />}
            {existingReview ? "후기 수정" : "수강 후기 작성"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 강의 정보 */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-sm text-muted-foreground mb-1">강의명</h3>
              <p className="font-semibold">{courseTitle}</p>
            </CardContent>
          </Card>

          {/* 별점 선택 */}
          <div className="space-y-3">
            <div>
              <h3 className="font-medium mb-2">강의는 어떠셨나요?</h3>
              <div className="flex items-center gap-1">
                {renderStars(true)}
                {rating > 0 && (
                  <span className="ml-2 text-sm font-medium text-muted-foreground">
                    {rating}점
                  </span>
                )}
              </div>
              {errors.rating && (
                <p className="text-sm text-red-500 mt-1">{errors.rating}</p>
              )}
            </div>
          </div>

          {/* 후기 작성 */}
          <div className="space-y-3">
            <div>
              <h3 className="font-medium mb-2">후기를 작성해주세요</h3>
              <Textarea
                placeholder="강의에 대한 솔직한 후기를 작성해주세요. 다른 수강생들에게 도움이 되는 정보를 공유해주시면 감사하겠습니다."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="min-h-32 resize-none"
                maxLength={1000}
              />
              <div className="flex justify-between items-center mt-2">
                {errors.review_text && (
                  <p className="text-sm text-red-500">{errors.review_text}</p>
                )}
                <p className="text-xs text-muted-foreground ml-auto">
                  {reviewText.length}/1000자
                </p>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0 || reviewText.trim().length < 10}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {existingReview ? "수정 중..." : "작성 중..."}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  {existingReview ? "수정 완료" : "후기 작성"}
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;