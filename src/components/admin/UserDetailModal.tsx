import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Edit, Lock, MessageCircle, Settings, User, BookOpen, CreditCard, Activity, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface UserDetailModalProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

// Mock user data - 실제로는 props로 받거나 API에서 가져올 데이터
const mockUserDetail = {
  id: 'user123',
  memberId: 'USR240001',
  name: '김영희',
  email: 'kim.younghee@example.com',
  phone: '010-1234-5678',
  grade: 'vip' as const,
  status: 'active' as const,
  joinDate: '2024-01-15T10:30:00Z',
  lastLogin: '2024-03-20T14:22:00Z',
  lastLoginIp: '192.168.1.1',
  marketingEmail: true,
  marketingSms: false,
  marketingEmailChangedAt: '2024-01-15T10:30:00Z',
  marketingSmsChangedAt: '2024-02-10T09:15:00Z',
  totalPayment: 340000,
  totalOrders: 5,
  lastOrderDate: '2024-03-15T16:20:00Z'
};

const mockAdminMemos = [
  {
    id: '1',
    content: '환불 요청 건 처리 완료. 카드 결제 취소 진행했음.',
    author: '김관리자',
    createdAt: '2024-03-20T14:30:00Z'
  },
  {
    id: '2',
    content: '강의 수강 관련 문의. 추가 권한 부여 완료.',
    author: '이관리자',
    createdAt: '2024-03-18T09:15:00Z'
  }
];

const mockEnrollments = [
  {
    id: '1',
    courseName: '웹 개발 기초',
    status: '수강중',
    progress: 75,
    lastStudyDate: '2024-03-20T10:00:00Z',
    certificateIssued: false
  },
  {
    id: '2',
    courseName: 'React 심화 과정',
    status: '완료',
    progress: 100,
    lastStudyDate: '2024-03-10T15:30:00Z',
    certificateIssued: true
  }
];

const mockOrders = [
  {
    id: 'ORDER001',
    date: '2024-03-15T16:20:00Z',
    productName: 'React 심화 과정',
    amount: 89000,
    status: '결제완료'
  },
  {
    id: 'ORDER002',
    date: '2024-02-20T11:10:00Z',
    productName: '웹 개발 기초',
    amount: 65000,
    status: '결제완료'
  }
];

const mockActivityLogs = [
  {
    id: '1',
    timestamp: '2024-03-20T14:22:00Z',
    activity: '로그인 성공',
    ip: '192.168.1.1'
  },
  {
    id: '2',
    timestamp: '2024-03-20T09:15:00Z',
    activity: '강의 시청 (React 심화 과정)',
    ip: '192.168.1.1'
  },
  {
    id: '3',
    timestamp: '2024-03-19T20:30:00Z',
    activity: '로그아웃',
    ip: '192.168.1.1'
  }
];

export const UserDetailModal = ({ userId, open, onClose }: UserDetailModalProps) => {
  const [newMemo, setNewMemo] = useState('');

  if (!userId) return null;

  const handleAddMemo = () => {
    if (newMemo.trim()) {
      // 실제로는 API 호출로 메모 저장
      console.log('새 메모 추가:', newMemo);
      setNewMemo('');
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: ko });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{mockUserDetail.grade === 'vip' ? 'VIP' : '일반'}</Badge>
              <span>{mockUserDetail.name}</span>
              <span className="text-muted-foreground">({mockUserDetail.email})</span>
              <Badge variant={mockUserDetail.status === 'active' ? 'default' : 'destructive'}>
                {mockUserDetail.status === 'active' ? '정상' : '정지'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-1" />
                정보 수정
              </Button>
              <Button size="sm" variant="outline">
                <Lock className="h-4 w-4 mr-1" />
                비밀번호 초기화
              </Button>
              <Button size="sm" variant="outline">
                <MessageCircle className="h-4 w-4 mr-1" />
                메시지 발송
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-1" />
                상태 변경
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              회원 정보
            </TabsTrigger>
            <TabsTrigger value="learning" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              학습 관리
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              결제 요약
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              활동 로그
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 계정 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle>계정 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">회원 ID:</span>
                    <span className="font-mono">{mockUserDetail.memberId}</span>
                    
                    <span className="text-muted-foreground">이메일:</span>
                    <span>{mockUserDetail.email}</span>
                    
                    <span className="text-muted-foreground">이름:</span>
                    <span>{mockUserDetail.name}</span>
                    
                    <span className="text-muted-foreground">연락처:</span>
                    <span>{mockUserDetail.phone}</span>
                    
                    <span className="text-muted-foreground">가입일:</span>
                    <span>{formatDate(mockUserDetail.joinDate)}</span>
                    
                    <span className="text-muted-foreground">최근 접속일:</span>
                    <span>{formatDate(mockUserDetail.lastLogin)}</span>
                    
                    <span className="text-muted-foreground">마지막 접속 IP:</span>
                    <span className="font-mono">{mockUserDetail.lastLoginIp}</span>
                    
                    <span className="text-muted-foreground">회원 등급:</span>
                    <Badge variant="outline">{mockUserDetail.grade === 'vip' ? 'VIP' : '일반'}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 마케팅 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle>마케팅 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">이메일 수신:</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={mockUserDetail.marketingEmail ? 'default' : 'secondary'}>
                        {mockUserDetail.marketingEmail ? '동의' : '거부'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(mockUserDetail.marketingEmailChangedAt)}
                      </span>
                    </div>
                    
                    <span className="text-muted-foreground">SMS 수신:</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={mockUserDetail.marketingSms ? 'default' : 'secondary'}>
                        {mockUserDetail.marketingSms ? '동의' : '거부'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(mockUserDetail.marketingSmsChangedAt)}
                      </span>
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
                <div className="space-y-2">
                  <Textarea
                    placeholder="CS 처리 내역이나 특이사항을 기록하세요..."
                    value={newMemo}
                    onChange={(e) => setNewMemo(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleAddMemo} disabled={!newMemo.trim()}>
                    메모 추가
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {mockAdminMemos.map((memo) => (
                    <div key={memo.id} className="p-3 border rounded-lg bg-muted/30">
                      <p className="text-sm">{memo.content}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        {memo.author} • {formatDate(memo.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="learning" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>수강 목록</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  수강 권한 부여
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>강의명</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>진도율</TableHead>
                      <TableHead>최근 학습일</TableHead>
                      <TableHead>수료증</TableHead>
                      <TableHead>관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">{enrollment.courseName}</TableCell>
                        <TableCell>
                          <Badge variant={enrollment.status === '완료' ? 'default' : 'secondary'}>
                            {enrollment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={enrollment.progress} className="w-16" />
                            <span className="text-sm">{enrollment.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(enrollment.lastStudyDate)}</TableCell>
                        <TableCell>
                          <Badge variant={enrollment.certificateIssued ? 'default' : 'outline'}>
                            {enrollment.certificateIssued ? '발급됨' : '미발급'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Minus className="h-4 w-4 mr-1" />
                            권한 회수
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">총 주문 건수</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockUserDetail.totalOrders}건</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">총 결제 금액</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(mockUserDetail.totalPayment)}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">최근 주문일</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg">{formatDate(mockUserDetail.lastOrderDate)}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>최근 주문 목록</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>주문일</TableHead>
                      <TableHead>주문번호</TableHead>
                      <TableHead>대표 상품명</TableHead>
                      <TableHead>결제 금액</TableHead>
                      <TableHead>상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockOrders.map((order) => (
                      <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>{formatDate(order.date)}</TableCell>
                        <TableCell className="font-mono text-sm text-primary hover:underline">
                          {order.id}
                        </TableCell>
                        <TableCell>{order.productName}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(order.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="default">{order.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>활동 로그</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockActivityLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{log.activity}</div>
                        <div className="text-sm text-muted-foreground">
                          IP: {log.ip}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(log.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};