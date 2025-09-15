import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Star, Edit, Trash2, MessageSquare } from 'lucide-react';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';

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
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "후기 관리 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "작성한 강의 후기를 관리하세요");
    
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchReviews();
  }, [user, navigate]);

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
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <UserSidebar />
            </div>
            
            <div className="lg:col-span-3">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">후기 관리</h1>
                <p className="text-muted-foreground">작성한 강의 후기를 관리하세요.</p>
              </div>

              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">작성한 후기가 없습니다</h3>
                    <p className="text-muted-foreground mb-4">강의를 수강한 후 후기를 작성해보세요.</p>
                    <Button onClick={() => navigate('/courses')}>
                      강의 둘러보기
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4">
                            <img
                              src={review.course.thumbnail_url || '/placeholder.svg'}
                              alt={review.course.title}
                              className="w-16 h-12 object-cover rounded"
                            />
                            <div>
                              <CardTitle className="text-lg line-clamp-1">
                                {review.course.title}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex">{renderStars(review.rating)}</div>
                                <Badge variant="outline">
                                  {review.rating}.0
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingReview(editingReview === review.id ? null : review.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        {editingReview === review.id ? (
                          <div className="space-y-4">
                            <Textarea
                              defaultValue={review.review_text}
                              placeholder="후기를 수정해주세요..."
                              className="min-h-[100px]"
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingReview(null)}
                              >
                                취소
                              </Button>
                              <Button size="sm">
                                저장
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {review.review_text || '후기 내용이 없습니다.'}
                          </p>
                        )}
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