import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  BookOpen, 
  CreditCard, 
  MessageSquare,
  Plus,
  ExternalLink,
  Activity,
  Lock,
  ShieldCheck,
  UserX,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface UserDetailData {
  id: string;
  memberId: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: string;
  grade: string;
  joinDate: string;
  lastLogin?: string;
  lastLoginIp?: string;
  marketingEmail: boolean;
  marketingSms: boolean;
  enrollments: Array<{
    id: string;
    courseName: string;
    status: 'progress' | 'completed';
    progress: number;
    lastStudyDate?: string;
    enrollDate: string;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    date: string;
    amount: number;
    status: string;
    items: Array<{ name: string; price: number }>;
  }>;
  adminNotes: Array<{
    id: string;
    content: string;
    createdBy: string;
    createdAt: string;
  }>;
  activityLogs: Array<{
    id: string;
    action: string;
    description: string;
    timestamp: string;
    ip?: string;
  }>;
}

interface UserDetailModalProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

export const UserDetailModal = ({ userId, open, onClose }: UserDetailModalProps) => {
  const [userDetail, setUserDetail] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchUserDetail();
    }
  }, [open, userId]);

  const fetchUserDetail = async () => {
    setLoading(true);
    
    // Mock data for now
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUserDetail: UserDetailData = {
      id: userId!,
      memberId: `USR${userId?.slice(-6).toUpperCase()}`,
      name: '김영희',
      email: 'kim.younghee@example.com',
      phone: '010-1234-5678',
      avatar: undefined,
      status: 'active',
      grade: 'vip',
      joinDate: '2024-01-15T10:30:00Z',
      lastLogin: '2024-03-20T14:22:00Z',
      lastLoginIp: '192.168.1.100',
      marketingEmail: true,
      marketingSms: false,
      enrollments: [
        {
          id: '1',
          courseName: '웹 개발 마스터 클래스',
          status: 'progress',
          progress: 75,
          lastStudyDate: '2024-03-19T10:30:00Z',
          enrollDate: '2024-02-01T09:00:00Z'
        },
        {
          id: '2',
          courseName: 'React 심화 과정',
          status: 'completed',
          progress: 100,
          lastStudyDate: '2024-03-15T16:45:00Z',
          enrollDate: '2024-01-20T11:15:00Z'
        }
      ],
      orders: [
        {
          id: '1',
          orderNumber: 'ORD-2024030001',
          date: '2024-03-01T10:30:00Z',
          amount: 89000,
          status: 'completed',
          items: [{ name: '웹 개발 마스터 클래스', price: 89000 }]
        },
        {
          id: '2',
          orderNumber: 'ORD-2024012001',
          date: '2024-01-20T14:15:00Z',
          amount: 79000,
          status: 'completed',
          items: [{ name: 'React 심화 과정', price: 79000 }]
        }
      ],
      adminNotes: [
        {
          id: '1',
          content: '강의 진도 문의에 대해 상담 완료. 학습 방법 가이드 제공.',
          createdBy: '관리자1',
          createdAt: '2024-03-18T09:30:00Z'
        },
        {
          id: '2',
          content: 'VIP 등급 승급 처리 완료. 혜택 안내 메일 발송.',
          createdBy: '관리자2',
          createdAt: '2024-03-10T16:20:00Z'
        }
      ],
      activityLogs: [
        {
          id: '1',
          action: 'login',
          description: '로그인',
          timestamp: '2024-03-20T14:22:00Z',
          ip: '192.168.1.100'
        },
        {
          id: '2',
          action: 'course_progress',
          description: '웹 개발 마스터 클래스 - 섹션 5 완료',
          timestamp: '2024-03-19T10:30:00Z'
        },
        {
          id: '3',
          action: 'profile_update',
          description: '프로필 정보 수정 (연락처 변경)',
          timestamp: '2024-03-18T11:45:00Z'
        }
      ]
    };

    setUserDetail(mockUserDetail);
    setLoading(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setAddingNote(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const note = {
      id: Date.now().toString(),
      content: newNote.trim(),
      createdBy: '현재 관리자',
      createdAt: new Date().toISOString()
    };
    
    setUserDetail(prev => prev ? {
      ...prev,
      adminNotes: [note, ...prev.adminNotes]
    } : null);
    
    setNewNote('');
    setAddingNote(false);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, label: '정상', icon: ShieldCheck },
      dormant: { variant: 'secondary' as const, label: '휴면', icon: User },
      suspended: { variant: 'destructive' as const, label: '정지', icon: UserX },
      withdrawn: { variant: 'outline' as const, label: '탈퇴', icon: UserX }
    };
    
    const config = variants[status as keyof typeof variants] || variants.active;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getGradeBadge = (grade: string) => {
    const variants = {
      normal: { variant: 'outline' as const, label: '일반' },
      vip: { variant: 'default' as const, label: 'VIP' },
      premium: { variant: 'secondary' as const, label: '프리미엄' }
    };
    
    const config = variants[grade as keyof typeof variants] || variants.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!userDetail) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <div className="flex items-center justify-center h-96">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>사용자 정보를 불러오는 중...</p>
              </div>
            ) : (
              <p>사용자 정보를 찾을 수 없습니다.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>사용자 상세 정보</DialogTitle>
        </DialogHeader>

        {/* 상단 요약 정보 */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userDetail.avatar} />
              <AvatarFallback>{userDetail.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{userDetail.name}</h3>
              <p className="text-muted-foreground">{userDetail.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(userDetail.status)}
                {getGradeBadge(userDetail.grade)}
                <Badge variant="outline" className="text-xs">
                  ID: {userDetail.memberId}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              정보 수정
            </Button>
            <Button variant="outline" size="sm">
              <Lock className="h-4 w-4 mr-2" />
              비밀번호 초기화
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              메시지 발송
            </Button>
          </div>
        </div>

        {/* 탭 영역 */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="profile" className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">회원 정보</TabsTrigger>
              <TabsTrigger value="learning">학습 관리</TabsTrigger>
              <TabsTrigger value="payments">결제 요약</TabsTrigger>
              <TabsTrigger value="activity">활동 로그</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[500px] mt-4">
              {/* Tab 1: 회원 정보 */}
              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <Label className="text-sm font-medium">이름</Label>
                          <p className="text-sm text-muted-foreground">{userDetail.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">이메일</Label>
                          <p className="text-sm text-muted-foreground">{userDetail.email}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">연락처</Label>
                          <p className="text-sm text-muted-foreground">{userDetail.phone || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">회원 ID</Label>
                          <p className="text-sm text-muted-foreground font-mono">{userDetail.memberId}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        계정 상태
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex justify-between">
                          <Label className="text-sm font-medium">가입일</Label>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(userDetail.joinDate), 'yyyy-MM-dd HH:mm', { locale: ko })}
                          </p>
                        </div>
                        <div className="flex justify-between">
                          <Label className="text-sm font-medium">최근 접속</Label>
                          <p className="text-sm text-muted-foreground">
                            {userDetail.lastLogin 
                              ? format(new Date(userDetail.lastLogin), 'yyyy-MM-dd HH:mm', { locale: ko })
                              : '-'
                            }
                          </p>
                        </div>
                        <div className="flex justify-between">
                          <Label className="text-sm font-medium">접속 IP</Label>
                          <p className="text-sm text-muted-foreground font-mono">
                            {userDetail.lastLoginIp || '-'}
                          </p>
                        </div>
                        <div className="flex justify-between">
                          <Label className="text-sm font-medium">회원 등급</Label>
                          {getGradeBadge(userDetail.grade)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>마케팅 수신 동의</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">이메일 마케팅</Label>
                        <Badge variant={userDetail.marketingEmail ? 'default' : 'secondary'}>
                          {userDetail.marketingEmail ? '동의' : '미동의'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">SMS 마케팅</Label>
                        <Badge variant={userDetail.marketingSms ? 'default' : 'secondary'}>
                          {userDetail.marketingSms ? '동의' : '미동의'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 관리자 메모 */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        관리자 메모
                      </CardTitle>
                      <Button
                        size="sm"
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || addingNote}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        메모 추가
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>새 메모 작성</Label>
                      <Textarea
                        placeholder="관리자 메모를 입력하세요..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      {userDetail.adminNotes.map((note) => (
                        <div key={note.id} className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm">{note.content}</p>
                          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            <span>작성자: {note.createdBy}</span>
                            <span>{format(new Date(note.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}</span>
                          </div>
                        </div>
                      ))}
                      {userDetail.adminNotes.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">등록된 관리자 메모가 없습니다.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: 학습 관리 */}
              <TabsContent value="learning" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      수강 목록
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userDetail.enrollments.map((enrollment) => (
                        <div key={enrollment.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{enrollment.courseName}</h4>
                            <Badge variant={enrollment.status === 'completed' ? 'default' : 'secondary'}>
                              {enrollment.status === 'completed' ? '완료' : '수강중'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div>
                              <Label className="font-medium">진도율</Label>
                              <p>{enrollment.progress}%</p>
                            </div>
                            <div>
                              <Label className="font-medium">수강 시작일</Label>
                              <p>{format(new Date(enrollment.enrollDate), 'yyyy-MM-dd', { locale: ko })}</p>
                            </div>
                            <div>
                              <Label className="font-medium">최근 학습일</Label>
                              <p>
                                {enrollment.lastStudyDate 
                                  ? format(new Date(enrollment.lastStudyDate), 'yyyy-MM-dd', { locale: ko })
                                  : '-'
                                }
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <Button variant="outline" size="sm">
                              수강 권한 회수
                            </Button>
                            <Button variant="outline" size="sm">
                              진도 초기화
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {userDetail.enrollments.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">수강 중인 강의가 없습니다.</p>
                      )}
                    </div>

                    <Separator className="my-4" />
                    
                    <div>
                      <h4 className="font-medium mb-2">수강 권한 수동 부여</h4>
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        강의 추가
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: 결제 요약 */}
              <TabsContent value="payments" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">총 주문 건수</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{userDetail.orders.length}건</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">총 결제 금액</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {userDetail.orders.reduce((sum, order) => sum + order.amount, 0).toLocaleString()}원
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">최근 주문일</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        {userDetail.orders.length > 0 
                          ? format(new Date(userDetail.orders[0].date), 'yyyy-MM-dd', { locale: ko })
                          : '-'
                        }
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      최근 주문 목록
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {userDetail.orders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{order.orderNumber}</p>
                              <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {order.items.map(item => item.name).join(', ')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(order.date), 'yyyy-MM-dd HH:mm', { locale: ko })}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                              {order.status === 'completed' ? '완료' : '대기'}
                            </Badge>
                            <p className="text-sm font-medium mt-1">
                              {order.amount.toLocaleString()}원
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {userDetail.orders.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">주문 내역이 없습니다.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 4: 활동 로그 */}
              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      사용자 활동 기록
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {userDetail.activityLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 border-l-2 border-muted">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{log.description}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span>{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}</span>
                              {log.ip && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">IP: {log.ip}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {log.action}
                          </Badge>
                        </div>
                      ))}
                      
                      {userDetail.activityLogs.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">활동 기록이 없습니다.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};