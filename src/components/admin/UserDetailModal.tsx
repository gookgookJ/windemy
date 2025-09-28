import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Mail, Phone, Calendar, CreditCard, BookOpen, MessageSquare, Plus } from 'lucide-react';
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
      // 사용자 기본 정보 조회
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // 수강 정보 조회
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            id,
            title,
            instructor_id,
            profiles!courses_instructor_id_fkey (full_name)
          )
        `)
        .eq('user_id', userId);

      if (enrollmentsError) throw enrollmentsError;

      // 주문 정보 조회
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            courses (title)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) throw ordersError;

      // 관리자 메모 조회
      const { data: notes, error: notesError } = await supabase
        .from('admin_notes')
        .select(`
          *,
          profiles!admin_notes_created_by_fkey (full_name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      setUserDetail({
        profile,
        enrollments: enrollments || [],
        orders: orders || []
      });
      setAdminNotes(notes || []);
    } catch (error) {
      console.error('Error fetching user detail:', error);
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
      const { error } = await supabase
        .from('admin_notes')
        .insert([{
          user_id: userId,
          note: newNote.trim(),
          created_by: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;

      setNewNote('');
      await fetchUserDetail(); // 메모 목록 새로고침
      
      toast({
        title: "메모 추가 완료",
        description: "관리자 메모가 성공적으로 추가되었습니다.",
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "메모 추가 실패",
        description: "메모 추가 중 오류가 발생했습니다.",
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>사용자 상세 정보</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>사용자 정보를 불러오는 중...</p>
            </div>
          </div>
        ) : userDetail ? (
          <div className="flex flex-col h-[80vh]">
            {/* 상단 사용자 요약 정보 */}
            <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg mb-4">
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
                                  강사: {enrollment.courses?.profiles?.full_name || '정보 없음'}
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
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium">총 주문</p>
                          <p className="text-xl font-bold">{userDetail.orders.length}건</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium">총 결제 금액</p>
                          <p className="text-xl font-bold">
                            {userDetail.orders.reduce((sum: number, order: any) => sum + order.total_amount, 0).toLocaleString()}원
                          </p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
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
                                <p className="font-medium">주문 #{order.id.slice(0, 8)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {order.order_items?.[0]?.courses?.title || '상품 정보 없음'}
                                  {order.order_items?.length > 1 && ` 외 ${order.order_items.length - 1}개`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(order.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{order.total_amount.toLocaleString()}원</p>
                                <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                                  {order.status === 'completed' ? '완료' : order.status}
                                </Badge>
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
                    <CardContent className="space-y-4">
                      {/* 새 메모 추가 */}
                      <div className="space-y-2">
                        <Label>새 메모 추가</Label>
                        <Textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="CS 처리 내역이나 특이사항을 기록하세요..."
                          rows={3}
                        />
                        <Button 
                          onClick={addNote}
                          disabled={!newNote.trim() || addingNote}
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {addingNote ? '추가 중...' : '메모 추가'}
                        </Button>
                      </div>

                      <Separator />

                      {/* 메모 목록 */}
                      <div>
                        <Label>메모 이력</Label>
                        <ScrollArea className="h-60 mt-2">
                          {adminNotes.length > 0 ? (
                            <div className="space-y-3">
                              {adminNotes.map((note: any) => (
                                <div key={note.id} className="p-3 border rounded-lg">
                                  <div className="flex items-start justify-between mb-2">
                                    <span className="text-sm font-medium">
                                      {note.profiles?.full_name || '알 수 없음'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(note.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                                    </span>
                                  </div>
                                  <p className="text-sm">{note.note}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-muted-foreground py-8">등록된 메모가 없습니다.</p>
                          )}
                        </ScrollArea>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};