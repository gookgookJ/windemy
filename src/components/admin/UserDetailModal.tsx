import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, BookOpen, CreditCard, Activity, MessageSquare, Key, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface UserDetailModalProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

export const UserDetailModal = ({ userId, open, onClose }: UserDetailModalProps) => {
  const [userDetail, setUserDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [memoText, setMemoText] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (userId && open) {
      fetchUserDetail();
    }
  }, [userId, open]);

  const fetchUserDetail = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // 사용자 기본 정보
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // 수강 정보
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            id,
            title,
            thumbnail_url
          )
        `)
        .eq('user_id', userId);

      if (enrollmentError) throw enrollmentError;

      // 주문 정보
      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            course_id
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (orderError) throw orderError;

      setUserDetail({
        profile,
        enrollments: enrollments || [],
        orders: orders || []
      });
    } catch (error) {
      console.error('Error fetching user detail:', error);
      toast({
        title: "오류",
        description: "사용자 정보를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addMemo = async () => {
    if (!memoText.trim() || !userId) return;

    try {
      // TODO: 관리자 메모 기능 구현
      toast({
        title: "메모 추가됨",
        description: "관리자 메모가 추가되었습니다."
      });
      setMemoText('');
    } catch (error) {
      toast({
        title: "오류",
        description: "메모 추가에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'instructor': return '강사';
      default: return '학생';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'instructor': return 'default';
      default: return 'secondary';
    }
  };

  if (!userDetail) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-lg">로딩 중...</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { profile, enrollments, orders } = userDetail;
  const totalPayment = orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="h-6 w-6" />
            사용자 상세 정보 - {profile.full_name || '이름 없음'}
          </DialogTitle>
        </DialogHeader>

        {/* 상단 공통 영역 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold">{profile.full_name || '이름 없음'}</h2>
                  <Badge variant={getRoleBadgeVariant(profile.role)}>
                    {getRoleLabel(profile.role)}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </div>
                  {profile.phone && (
                    <div>연락처: {profile.phone}</div>
                  )}
                  <div>가입일: {format(new Date(profile.created_at), 'yyyy년 MM월 dd일', { locale: ko })}</div>
                  <div>총 결제금액: {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(totalPayment)}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  비밀번호 초기화
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  메시지 발송
                </Button>
                <Button variant="outline">
                  계정 상태 변경
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 탭 영역 */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">회원 정보</TabsTrigger>
            <TabsTrigger value="learning">학습 관리</TabsTrigger>
            <TabsTrigger value="payments">결제 요약</TabsTrigger>
            <TabsTrigger value="activity">활동 로그</TabsTrigger>
          </TabsList>

          {/* Tab 1: 회원 정보 */}
          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>계정 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">회원 ID</label>
                    <div className="text-sm text-muted-foreground">{profile.id}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">이메일</label>
                    <div className="text-sm">{profile.email}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">이름</label>
                    <div className="text-sm">{profile.full_name || '설정되지 않음'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">연락처</label>
                    <div className="text-sm">{profile.phone || '설정되지 않음'}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>마케팅 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">이메일 수신 동의</label>
                    <div className="text-sm">
                      <Badge variant={profile.marketing_consent ? "default" : "secondary"}>
                        {profile.marketing_consent ? "동의" : "미동의"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">SMS 수신 동의</label>
                    <div className="text-sm">
                      <Badge variant="secondary">미설정</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 관리자 메모 */}
            <Card>
              <CardHeader>
                <CardTitle>관리자 메모</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="이 사용자에 대한 메모를 작성하세요..."
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                  rows={3}
                />
                <Button onClick={addMemo} disabled={!memoText.trim()}>
                  메모 추가
                </Button>
                
                {/* 기존 메모 목록 */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    아직 작성된 메모가 없습니다.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: 학습 관리 */}
          <TabsContent value="learning">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  수강 목록 ({enrollments.length}건)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {enrollments.length > 0 ? (
                  <div className="space-y-4">
                    {enrollments.map((enrollment: any) => (
                      <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-muted rounded-lg"></div>
                          <div>
                            <h4 className="font-medium">{enrollment.courses?.title || '강의명 없음'}</h4>
                            <div className="text-sm text-muted-foreground">
                              수강 시작: {format(new Date(enrollment.enrolled_at), 'yyyy-MM-dd', { locale: ko })}
                            </div>
                            <div className="text-sm">
                              진도율: {Math.round(enrollment.progress || 0)}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={enrollment.completed_at ? "default" : "secondary"}>
                            {enrollment.completed_at ? "완료" : "수강중"}
                          </Badge>
                          <Button variant="outline" size="sm">
                            권한 관리
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    수강 중인 강의가 없습니다.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: 결제 요약 */}
          <TabsContent value="payments">
            <div className="space-y-6">
              {/* 요약 지표 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{orders.length}</div>
                    <div className="text-sm text-muted-foreground">총 주문 건수</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat('ko-KR', { 
                        style: 'currency', 
                        currency: 'KRW',
                        maximumFractionDigits: 0 
                      }).format(totalPayment)}
                    </div>
                    <div className="text-sm text-muted-foreground">총 결제 금액</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">
                      {orders.length > 0 ? format(new Date(orders[0].created_at), 'MM.dd', { locale: ko }) : '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">최근 주문일</div>
                  </CardContent>
                </Card>
              </div>

              {/* 최근 주문 목록 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    최근 주문 목록
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length > 0 ? (
                    <div className="space-y-3">
                      {orders.slice(0, 10).map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">주문 #{order.id.slice(0, 8)}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(order.total_amount)}
                            </div>
                            <Badge variant="outline">{order.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      주문 내역이 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 4: 활동 로그 */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  활동 로그
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  활동 로그 기능은 추후 구현 예정입니다.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};