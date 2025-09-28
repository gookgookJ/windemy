import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Mail, Phone, Calendar, CreditCard, BookOpen, MessageSquare, Plus, Clock, Star, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface UserDetailModalProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

export const UserDetailModal = ({ userId, open, onClose }: UserDetailModalProps) => {
  const [userDetail, setUserDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const { toast } = useToast();

  const fetchUserDetail = async () => {
    if (!userId) return;
    
    setLoading(true);
    
    try {
      // 사용자 프로필 정보 조회
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // 수강 정보 조회
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            id,
            title,
            instructor:profiles!instructor_id (
              full_name
            )
          )
        `)
        .eq('user_id', userId);

      if (enrollmentsError) throw enrollmentsError;

      // 주문 정보 조회
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            courses (
              title
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // 관리자 메모 조회
      const { data: notesData, error: notesError } = await supabase
        .from('admin_notes')
        .select(`
          *,
          created_by:profiles!created_by (
            full_name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      setUserDetail({
        profile: profileData,
        enrollments: enrollmentsData || [],
        orders: ordersData || []
      });
      setAdminNotes(notesData || []);
      
    } catch (error) {
      console.error('Error fetching user detail:', error);
      setUserDetail(null);
      setAdminNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && userId) {
      fetchUserDetail();
    }
  }, [open, userId]);

  const addNote = async () => {
    if (!newNote.trim() || !userId) return;
    
    setAddingNote(true);
    
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('User not authenticated');

      const { data: newNoteData, error } = await supabase
        .from('admin_notes')
        .insert({
          user_id: userId,
          note: newNote.trim(),
          created_by: currentUser.user.id
        })
        .select(`
          *,
          created_by:profiles!created_by (
            full_name
          )
        `)
        .single();

      if (error) throw error;

      setAdminNotes(prev => [newNoteData, ...prev]);
      setNewNote('');
      
      toast({
        title: "메모 추가 완료",
        description: "관리자 메모가 성공적으로 추가되었습니다.",
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "메모 추가 실패",
        description: "관리자 메모 추가에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setAddingNote(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'instructor': return '강사';
      case 'student': return '학생';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive' as const;
      case 'instructor': return 'default' as const;
      case 'student': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      case 'refunded': return '환불';
      default: return status;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default' as const;
      case 'pending': return 'secondary' as const;
      case 'cancelled': return 'destructive' as const;
      case 'refunded': return 'outline' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>사용자 상세 정보</DialogTitle>
          <DialogDescription>
            사용자의 상세 정보, 학습 현황, 결제 내역 및 관리자 메모를 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>사용자 정보를 불러오는 중...</p>
            </div>
          </div>
        ) : userDetail ? (
          <div className="flex flex-col h-[75vh]">
            {/* 상단 사용자 요약 정보 */}
            <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{userDetail.profile.full_name}</h3>
                <p className="text-muted-foreground">{userDetail.profile.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={getRoleBadgeVariant(userDetail.profile.role)}>
                    {getRoleLabel(userDetail.profile.role)}
                  </Badge>
                  <Badge variant="outline">
                    가입일: {format(new Date(userDetail.profile.created_at), 'yyyy-MM-dd', { locale: ko })}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  메시지 발송
                </Button>
                <Button variant="outline" size="sm">
                  비밀번호 초기화
                </Button>
              </div>
            </div>

            {/* 탭 영역 */}
            <Tabs defaultValue="profile" className="flex-1 overflow-hidden">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">회원 정보</TabsTrigger>
                <TabsTrigger value="learning">학습 관리</TabsTrigger>
                <TabsTrigger value="payments">결제 요약</TabsTrigger>
                <TabsTrigger value="notes">관리자 메모</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-auto mt-4">
                <TabsContent value="profile" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        계정 정보
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">이름</label>
                          <p className="text-sm text-muted-foreground">{userDetail.profile.full_name || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">이메일</label>
                          <p className="text-sm text-muted-foreground">{userDetail.profile.email}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">연락처</label>
                          <p className="text-sm text-muted-foreground">{userDetail.profile.phone || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">권한</label>
                          <Badge variant={getRoleBadgeVariant(userDetail.profile.role)}>
                            {getRoleLabel(userDetail.profile.role)}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium">가입일</label>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(userDetail.profile.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">마지막 수정일</label>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(userDetail.profile.updated_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                          </p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <label className="text-sm font-medium">마케팅 수신 동의</label>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">이메일 마케팅</span>
                            <Badge variant={userDetail.profile.marketing_consent ? 'default' : 'secondary'}>
                              {userDetail.profile.marketing_consent ? '동의' : '미동의'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="learning" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        수강 목록
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userDetail.enrollments.length > 0 ? (
                        <div className="space-y-4">
                          {userDetail.enrollments.map((enrollment: any) => (
                            <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <h4 className="font-medium">{enrollment.courses?.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  강사: {enrollment.courses?.instructor?.full_name || '정보 없음'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  수강 시작: {format(new Date(enrollment.enrolled_at), 'yyyy-MM-dd', { locale: ko })}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant={enrollment.completed_at ? 'default' : 'secondary'}>
                                  {enrollment.completed_at ? '완료' : '수강중'}
                                </Badge>
                                <p className="text-sm text-muted-foreground mt-1">
                                  진도율: {Math.round(enrollment.progress || 0)}%
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">수강 중인 강의가 없습니다.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        결제 요약
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm font-medium">총 주문</p>
                          <p className="text-xl font-bold">{userDetail.orders.length}건</p>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm font-medium">총 결제 금액</p>
                          <p className="text-xl font-bold">
                            {userDetail.orders.reduce((sum: number, order: any) => sum + order.total_amount, 0).toLocaleString()}원
                          </p>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm font-medium">최근 주문</p>
                          <p className="text-xl font-bold">
                            {userDetail.orders.length > 0 
                              ? format(new Date(userDetail.orders[0].created_at), 'MM/dd', { locale: ko })
                              : '-'
                            }
                          </p>
                        </div>
                      </div>

                      {userDetail.orders.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="font-medium">최근 주문 목록</h4>
                          {userDetail.orders.slice(0, 5).map((order: any) => (
                            <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">주문 #{order.id.slice(-8)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {order.order_items?.[0]?.courses?.title || '상품 정보 없음'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(order.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant={getStatusBadgeVariant(order.status)}>
                                  {getStatusLabel(order.status)}
                                </Badge>
                                <p className="text-sm font-medium mt-1">
                                  {order.total_amount.toLocaleString()}원
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">주문 내역이 없습니다.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        관리자 메모
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="새 메모를 입력하세요..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="flex-1"
                            rows={3}
                          />
                          <Button 
                            onClick={addNote}
                            disabled={!newNote.trim() || addingNote}
                            size="sm"
                            className="self-end"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {addingNote ? '추가 중...' : '추가'}
                          </Button>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          {adminNotes.length > 0 ? (
                            adminNotes.map((note: any) => (
                              <div key={note.id} className="p-3 border rounded-lg">
                                <p className="text-sm mb-2">{note.note}</p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>작성자: {note.created_by?.full_name || '관리자'}</span>
                                  <span>{format(new Date(note.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-muted-foreground py-8">작성된 메모가 없습니다.</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">사용자 정보를 찾을 수 없습니다</h3>
              <p className="text-sm text-muted-foreground mb-4">
                요청하신 사용자의 정보를 불러올 수 없습니다.
              </p>
              <Button variant="outline" onClick={onClose}>
                닫기
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};