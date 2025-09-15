import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Star, Gift, Crown } from 'lucide-react';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';

const HonorsBenefits = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "아너스 혜택 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "아너스 회원 전용 혜택을 확인하세요");
    
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
                <h1 className="text-3xl font-bold mb-2">아너스 혜택</h1>
                <p className="text-muted-foreground">특별한 아너스 회원 혜택을 확인하세요.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-primary" />
                      현재 등급
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <Badge className="mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                        실버 등급
                      </Badge>
                      <p className="text-muted-foreground">
                        다음 등급까지 2개 강의 더 수강하세요
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      적립된 포인트
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-2">
                        12,500P
                      </div>
                      <p className="text-muted-foreground">
                        강의 구매 시 사용 가능합니다
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    아너스 혜택
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">할인 혜택</h3>
                      <p className="text-muted-foreground text-sm">
                        모든 강의 10% 추가 할인
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">포인트 적립</h3>
                      <p className="text-muted-foreground text-sm">
                        구매 금액의 5% 포인트 적립
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">우선 지원</h3>
                      <p className="text-muted-foreground text-sm">
                        고객센터 우선 응답 서비스
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">특별 이벤트</h3>
                      <p className="text-muted-foreground text-sm">
                        아너스 회원 전용 이벤트 참여
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HonorsBenefits;