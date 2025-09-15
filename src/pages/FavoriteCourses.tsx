import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, BookOpen } from 'lucide-react';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';

const FavoriteCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "관심 클래스 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "관심있는 강의들을 확인하고 관리하세요");
    
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

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
                <h1 className="text-3xl font-bold mb-2">관심 클래스</h1>
                <p className="text-muted-foreground">관심있는 강의들을 확인하고 관리하세요.</p>
              </div>

              <Card>
                <CardContent className="p-12 text-center">
                  <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">관심 클래스가 없습니다</h3>
                  <p className="text-muted-foreground mb-4">관심있는 강의를 추가해보세요.</p>
                  <Button onClick={() => navigate('/courses')}>
                    강의 둘러보기
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FavoriteCourses;