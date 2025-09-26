import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Send, Edit3, Sparkles, Heart, ThumbsUp, Award } from 'lucide-react';
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

const ratingLabels = {
  1: { text: "아쉬워요", emoji: "😔", color: "text-red-500" },
  2: { text: "별로예요", emoji: "😐", color: "text-orange-500" },
  3: { text: "보통이에요", emoji: "🙂", color: "text-yellow-500" },
  4: { text: "좋아요", emoji: "😊", color: "text-blue-500" },
  5: { text: "최고예요", emoji: "🤩", color: "text-green-500" }
};

const ReviewModal = ({ courseId, courseTitle, trigger, existingReview, onReviewSubmitted }: ReviewModalProps) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [reviewText, setReviewText] = useState(existingReview?.review_text || '');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'rating' | 'writing'>('rating');

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setReviewText(existingReview.review_text);
      setStep('writing');
    }
  }, [existingReview]);

  useEffect(() => {
    if (open && !existingReview) {
      setRating(0);
      setReviewText('');
      setStep('rating');
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
        title: "🎉 후기 " + (existingReview ? "수정" : "작성") + " 완료!",
        description: `소중한 ${rating}점 후기를 남겨주셔서 감사합니다.`,
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
    if (!existingReview) {
      setTimeout(() => setStep('writing'), 300);
    }
  };

  const currentRatingLabel = ratingLabels[rating as keyof typeof ratingLabels];

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const isActive = (hoveredStar >= starValue || (hoveredStar === 0 && rating >= starValue));
      const isHovered = hoveredStar >= starValue;

      return (
        <button
          key={starValue}
          type="button"
          className={`relative transition-all duration-300 transform ${
            isActive ? 'scale-110' : 'scale-100 hover:scale-105'
          } ${isHovered ? 'animate-pulse' : ''}`}
          onMouseEnter={() => setHoveredStar(starValue)}
          onMouseLeave={() => setHoveredStar(0)}
          onClick={() => handleRatingSelect(starValue)}
        >
          <Star
            className={`h-12 w-12 transition-all duration-300 ${
              isActive 
                ? 'text-yellow-400 fill-yellow-400 drop-shadow-lg' 
                : 'text-gray-200 hover:text-yellow-200'
            }`}
          />
          {isActive && (
            <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-ping" />
          )}
        </button>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl border-0 p-0 overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
        <div className="relative">
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl" />
          
          <div className="relative p-8">
            <DialogHeader className="text-center mb-8">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg">
                {existingReview ? (
                  <Edit3 className="h-8 w-8 text-white" />
                ) : (
                  <Sparkles className="h-8 w-8 text-white" />
                )}
              </div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {existingReview ? "후기 수정하기" : "수강 후기 작성하기"}
              </DialogTitle>
              <p className="text-muted-foreground mt-2">
                다른 수강생들에게 도움이 되는 솔직한 후기를 남겨주세요
              </p>
            </DialogHeader>

            {/* 강의 정보 카드 */}
            <Card className="mb-8 border-0 bg-gradient-to-r from-muted/50 to-muted/30 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-12 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">수강하신 강의</p>
                    <h3 className="font-semibold text-lg leading-tight">{courseTitle}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            {step === 'rating' && (
              <div className="text-center space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-xl font-semibold mb-3">강의는 어떠셨나요?</h3>
                  <p className="text-muted-foreground">별점을 선택해주세요</p>
                </div>

                {/* 별점 선택 */}
                <div className="flex justify-center items-center gap-2">
                  {renderStars()}
                </div>

                {/* 평점 레이블 */}
                <div className="h-16 flex items-center justify-center">
                  {(hoveredStar > 0 || rating > 0) && (
                    <div className={`flex items-center gap-3 animate-scale-in ${
                      ratingLabels[(hoveredStar || rating) as keyof typeof ratingLabels]?.color
                    }`}>
                      <span className="text-2xl">
                        {ratingLabels[(hoveredStar || rating) as keyof typeof ratingLabels]?.emoji}
                      </span>
                      <span className="text-lg font-medium">
                        {ratingLabels[(hoveredStar || rating) as keyof typeof ratingLabels]?.text}
                      </span>
                    </div>
                  )}
                </div>

                {errors.rating && (
                  <p className="text-red-500 text-sm animate-fade-in">{errors.rating}</p>
                )}
              </div>
            )}

            {step === 'writing' && (
              <div className="space-y-6 animate-fade-in">
                {/* 선택된 평점 표시 */}
                <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-6 w-6 ${
                          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {currentRatingLabel && (
                    <div className={`flex items-center gap-2 ${currentRatingLabel.color}`}>
                      <span className="text-lg">{currentRatingLabel.emoji}</span>
                      <span className="font-medium">{currentRatingLabel.text}</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('rating')}
                    className="text-xs hover:bg-primary/10"
                  >
                    변경
                  </Button>
                </div>

                {/* 후기 작성 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">상세한 후기를 작성해주세요</h3>
                  <div className="relative">
                    <Textarea
                      placeholder="• 강의 내용은 어떠셨나요?&#10;• 강사님의 설명은 이해하기 쉬웠나요?&#10;• 다른 수강생들에게 추천하고 싶은 포인트가 있다면?&#10;&#10;솔직하고 구체적인 후기일수록 다른 분들에게 더 도움이 됩니다 ✨"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      className="min-h-40 resize-none border-2 border-muted focus:border-primary/50 rounded-xl transition-all duration-300"
                      maxLength={1000}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-lg">
                      {reviewText.length}/1000자
                    </div>
                  </div>
                  {errors.review_text && (
                    <p className="text-red-500 text-sm mt-2 animate-fade-in">{errors.review_text}</p>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="flex-1 h-12 border-2 hover:bg-muted/50 transition-all duration-300"
                    disabled={isSubmitting}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || rating === 0 || reviewText.trim().length < 10}
                    className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        {existingReview ? "수정 중..." : "작성 중..."}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        {existingReview ? "수정 완료" : "후기 등록"}
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;