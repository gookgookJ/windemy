import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Star, Edit, Trash2, MessageSquare, Calendar, Search, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';
import ReviewModal from '@/components/ReviewModal';

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  course: {
    id: string;
    title: string;
    thumbnail_url: string;
  };
}

const ReviewManagement = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "후기 관리 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "작성한 강의 후기를 관리하세요");
    
    if (!user) {
      navigate('/');
      return;
    }
    fetchReviews();
  }, [user, navigate]);

  // 검색 및 필터링
  useEffect(() => {
    let filtered = reviews;

    if (searchQuery) {
      filtered = filtered.filter(review =>
        review.course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.review_text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedRating) {
      filtered = filtered.filter(review => review.rating === selectedRating);
    }

    setFilteredReviews(filtered);
  }, [reviews, searchQuery, selectedRating]);

  const fetchReviews = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('course_reviews')
        .select(`
          id,
          rating,
          review_text,
          created_at,
          course:courses(
            id,
            title,
            thumbnail_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "데이터 로드 실패",
        description: "후기 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('course_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(reviews.filter(review => review.id !== reviewId));
      toast({
        title: "후기 삭제 완료",
        description: "후기가 성공적으로 삭제되었습니다.",
      });
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast({
        title: "삭제 실패",
        description: error.message || "후기 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleReviewUpdated = () => {
    fetchReviews();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingText = (rating: number) => {
    const texts = {
      5: '매우 만족',
      4: '만족',
      3: '보통',
      2: '불만족',
      1: '매우 불만족'
    };
    return texts[rating as keyof typeof texts] || '';
  };

  if (loading) {
    return (
      <div className="bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">후기 목록을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 사이드바 - 데스크톱에서만 표시 */}
            <div className="lg:col-span-1 hidden lg:block">
              <UserSidebar />
            </div>
            
            <div className="lg:col-span-3 space-y-6">
              {/* 헤더 */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">후기 관리</h1>
                  <p className="text-muted-foreground">작성한 강의 후기를 관리하고 수정할 수 있습니다</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm">
                    총 {reviews.length}개
                  </Badge>
                </div>
              </div>

              {/* 검색 및 필터 */}
              {reviews.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* 검색 */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="강의명 또는 후기 내용으로 검색..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      {/* 평점 필터 */}
                      <div className="flex gap-2">
                        <Button
                          variant={selectedRating === null ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedRating(null)}
                        >
                          전체
                        </Button>
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <Button
                            key={rating}
                            variant={selectedRating === rating ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedRating(rating)}
                            className="flex items-center gap-1"
                          >
                            <Star className="h-3 w-3 fill-current" />
                            {rating}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 후기 목록 */}
              {filteredReviews.length === 0 ? (
                <Card>
                  <CardContent className="p-8 md:p-12 text-center">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {reviews.length === 0 ? "작성한 후기가 없습니다" : "검색 결과가 없습니다"}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {reviews.length === 0 
                        ? "강의를 수강한 후 후기를 작성해보세요." 
                        : "다른 검색어나 필터를 시도해보세요."
                      }
                    </p>
                    {reviews.length === 0 && (
                      <Button onClick={() => navigate('/my-page')}>
                        내 강의실로 이동
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {filteredReviews.map((review) => (
                    <Card key={review.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex gap-4">
                            <div className="shrink-0">
                              <img
                                src={review.course.thumbnail_url || '/placeholder.svg'}
                                alt={review.course.title}
                                className="w-20 h-14 md:w-24 md:h-16 object-cover rounded-lg border"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg md:text-xl line-clamp-2 mb-2">
                                {review.course.title}
                              </CardTitle>
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-1">
                                  {renderStars(review.rating)}
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {review.rating}.0 • {getRatingText(review.rating)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {new Date(review.created_at).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* 액션 버튼 */}
                          <div className="flex flex-wrap gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/course/${review.course.id}`)}
                              className="text-xs"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              강의 보기
                            </Button>
                            <ReviewModal
                              courseId={review.course.id}
                              courseTitle={review.course.title}
                              existingReview={review}
                              onReviewSubmitted={handleReviewUpdated}
                              trigger={
                                <Button size="sm" variant="outline" className="text-xs">
                                  <Edit className="h-3 w-3 mr-1" />
                                  수정
                                </Button>
                              }
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-xs text-red-600 hover:text-red-700">
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  삭제
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>후기 삭제</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    정말로 이 후기를 삭제하시겠습니까? 삭제된 후기는 복구할 수 없습니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteReview(review.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    삭제
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                            {review.review_text || '후기 내용이 없습니다.'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReviewManagement;