import { useState, useEffect } from 'react';
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

// Mock 데이터 생성 함수
const generateMockUserDetail = (userId: string) => {
  const mockUserDetails: { [key: string]: any } = {
    '1': {
      profile: {
        id: '1',
        full_name: '김영희',
        email: 'kim.younghee@email.com',
        phone: '010-1234-5678',
        role: 'student',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-03-15T10:30:00Z',
        avatar_url: null,
        marketing_consent: true,
      },
      enrollments: [
        {
          id: 'e1',
          enrolled_at: '2024-02-01T10:00:00Z',
          progress: 75,
          completed_at: null,
          courses: {
            id: 'c1',
            title: '실무 웹 개발 완성 과정',
            instructor: {
              full_name: '이철수'
            }
          }
        },
        {
          id: 'e2',
          enrolled_at: '2024-01-20T10:00:00Z',
          progress: 100,
          completed_at: '2024-02-20T15:30:00Z',
          courses: {
            id: 'c2',
            title: 'JavaScript 기초부터 심화까지',
            instructor: {
              full_name: '박민지'
            }
          }
        }
      ],
      orders: [
        {
          id: 'order-1',
          created_at: '2024-03-01T14:30:00Z',
          total_amount: 89000,
          status: 'completed',
          payment_method: 'card',
          order_items: [
            {
              courses: {
                title: '실무 웹 개발 완성 과정'
              }
            }
          ]
        },
        {
          id: 'order-2',
          created_at: '2024-01-20T11:00:00Z',
          total_amount: 67000,
          status: 'completed',
          payment_method: 'card',
          order_items: [
            {
              courses: {
                title: 'JavaScript 기초부터 심화까지'
              }
            }
          ]
        }
      ]
    },
    '2': {
      profile: {
        id: '2',
        full_name: '이철수',
        email: 'lee.chulsoo@email.com',
        phone: '010-2345-6789',
        role: 'instructor',
        created_at: '2023-11-08T09:15:00Z',
        updated_at: '2024-03-10T09:15:00Z',
        avatar_url: null,
        marketing_consent: false,
      },
      enrollments: [],
      orders: []
    },
    '3': {
      profile: {
        id: '3',
        full_name: '박민지',
        email: 'park.minji@email.com',
        phone: '010-3456-7890',
        role: 'student',
        created_at: '2024-02-20T11:00:00Z',
        updated_at: '2024-03-18T11:00:00Z',
        avatar_url: null,
        marketing_consent: true,
      },
      enrollments: [
        {
          id: 'e3',
          enrolled_at: '2024-03-01T09:00:00Z',
          progress: 45,
          completed_at: null,
          courses: {
            id: 'c3',
            title: 'React 완벽 마스터',
            instructor: {
              full_name: '강태우'
            }
          }
        }
      ],
      orders: [
        {
          id: 'order-3',
          created_at: '2024-03-01T09:00:00Z',
          total_amount: 156000,
          status: 'completed',
          payment_method: 'card',
          order_items: [
            {
              courses: {
                title: 'React 완벽 마스터'
              }
            }
          ]
        }
      ]
    }
  };

  return mockUserDetails[userId] || null;
};

const generateMockAdminNotes = (userId: string) => {
  const mockNotes: { [key: string]: any[] } = {
    '1': [
      {
        id: 'note-1',
        note: '결제 관련 문의 - 카드 승인 오류 해결 완료',
        created_at: '2024-03-15T10:30:00Z',
        updated_at: '2024-03-15T10:30:00Z',
        created_by: {
          full_name: '관리자'
        }
      },
      {
        id: 'note-2',
        note: '강의 진도 문의 - 영상 재생 오류 해결',
        created_at: '2024-03-10T14:20:00Z',
        updated_at: '2024-03-10T14:20:00Z',
        created_by: {
          full_name: '관리자'
        }
      }
    ],
    '2': [
      {
        id: 'note-3',
        note: '강사 계정 승인 완료',
        created_at: '2024-03-05T11:15:00Z',
        updated_at: '2024-03-05T11:15:00Z',
        created_by: {
          full_name: '관리자'
        }
      }
    ],
    '3': []
  };

  return mockNotes[userId] || [];
};

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
    
    // Mock 데이터 로딩 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockDetail = generateMockUserDetail(userId);
    const mockNotes = generateMockAdminNotes(userId);
    
    setUserDetail(mockDetail);
    setAdminNotes(mockNotes);
    setLoading(false);
  };

  useEffect(() => {
    if (open && userId) {
      fetchUserDetail();
    }
  }, [open, userId]);

  const addNote = async () => {
    if (!newNote.trim() || !userId) return;
    
    setAddingNote(true);
    
    // Mock 메모 추가 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newMockNote = {
      id: `note-${Date.now()}`,
      note: newNote.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: {
        full_name: '관리자'
      }
    };
    
    setAdminNotes(prev => [newMockNote, ...prev]);
    setNewNote('');
    setAddingNote(false);
    
    toast({
      title: "메모 추가 완료",
      description: "관리자 메모가 성공적으로 추가되었습니다.",
    });
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
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {note.created_by?.full_name || '시스템'}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(note.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">{note.note}</p>
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
        ) : (
          <div className="text-center text-muted-foreground py-8">
            사용자 정보를 찾을 수 없습니다.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};