import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Star, Edit2 } from 'lucide-react';
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
    .max(500, "후기는 500자 이하로 작성해주세요")
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

  useEffect(() => {
    if (open && !existingReview) {
      setRating(0);
      setReviewText('');
      setErrors({});
    }
  }, [open, existingReview]);

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
        result = await supabase
          .from('course_reviews')
          .update(reviewData)
          .eq('id', existingReview.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('course_reviews')
          .insert(reviewData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: "후기 " + (existingReview ? "수정" : "작성") + " 완료",
        description: `후기를 성공적으로 ${existingReview ? "수정" : "등록"}했습니다.`,
      });

      setOpen(false);
      onReviewSubmitted?.();

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

  const handleRatingSelect = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const isActive = (hoveredStar >= starValue || (hoveredStar === 0 && rating >= starValue));

      return (
        <button
          key={starValue}
          type="button"
          className="p-1 transition-colors"
          onMouseEnter={() => setHoveredStar(starValue)}
          onMouseLeave={() => setHoveredStar(0)}
          onClick={() => handleRatingSelect(starValue)}
        >
          <Star
            className={`h-8 w-8 transition-colors ${
              isActive 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300 hover:text-yellow-200'
            }`}
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {existingReview ? <Edit2 className="h-5 w-5" /> : <Star className="h-5 w-5" />}
            {existingReview ? "후기 수정" : "수강 후기 작성"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 강의 제목 */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">{courseTitle}</p>
          </div>

          {/* 별점 선택 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">별점</label>
            <div className="flex gap-1">
              {renderStars()}
            </div>
            {errors.rating && (
              <p className="text-red-500 text-sm">{errors.rating}</p>
            )}
          </div>

          {/* 후기 작성 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">후기</label>
            <Textarea
              placeholder="강의에 대한 솔직한 후기를 작성해주세요."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="min-h-32 resize-none"
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{reviewText.length}/500자</span>
              {errors.review_text && (
                <span className="text-red-500">{errors.review_text}</span>
              )}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
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
              {isSubmitting ? "저장 중..." : (existingReview ? "수정" : "등록")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;