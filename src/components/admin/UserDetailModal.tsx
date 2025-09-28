import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Edit, Lock, MessageCircle, User, BookOpen, CreditCard, Activity, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface UserDetailModalProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

// Mock user data
const mockUserDetail = {
  id: 'user123',
  memberId: 'USR240001',
  name: '김영희',
  email: 'kim.younghee@example.com',
  phone: '010-1234-5678',
  status: 'active' as const,
  joinDate: '2024-01-15T10:30:00Z',
  lastLogin: '2024-03-20T14:22:00Z',
  lastLoginIp: '192.168.1.1',
  marketingEmail: true,
  marketingEmailChangedAt: '2024-01-15T10:30:00Z',
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
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{mockUserDetail.name}</span>
                  <Badge variant={mockUserDetail.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {mockUserDetail.status === 'active' ? '정상' : '휴면'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{mockUserDetail.email}</span>
                  <span>•</span>
                  <span className="font-mono">{mockUserDetail.memberId}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-9">
                <Edit className="h-4 w-4 mr-2" />
                정보수정
              </Button>
              <Button size="sm" variant="outline" className="h-9">
                <MessageCircle className="h-4 w-4 mr-2" />
                메시지
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose} className="h-9 w-9 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="profile" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                회원정보
              </TabsTrigger>
              <TabsTrigger value="learning" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                수강내역
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                결제정보
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                활동로그
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-2">
              <TabsContent value="profile" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 기본 정보 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">기본 정보</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <span className="text-muted-foreground">이름</span>
                        <span className="col-span-2 font-medium">{mockUserDetail.name}</span>
                        
                        <span className="text-muted-foreground">이메일</span>
                        <span className="col-span-2">{mockUserDetail.email}</span>
                        
                        <span className="text-muted-foreground">연락처</span>
                        <span className="col-span-2">{mockUserDetail.phone}</span>
                        
                        <span className="text-muted-foreground">가입일</span>
                        <span className="col-span-2">{formatDate(mockUserDetail.joinDate)}</span>
                        
                        <span className="text-muted-foreground">최근접속</span>
                        <span className="col-span-2">{formatDate(mockUserDetail.lastLogin)}</span>
                        
                        <span className="text-muted-foreground">접속IP</span>
                        <span className="col-span-2 font-mono text-xs">{mockUserDetail.lastLoginIp}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 마케팅 정보 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">마케팅 수신설정</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">이메일 수신</span>
                        <Badge variant={mockUserDetail.marketingEmail ? 'default' : 'secondary'} className="text-xs">
                          {mockUserDetail.marketingEmail ? '동의' : '거부'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        마지막 변경: {formatDate(mockUserDetail.marketingEmailChangedAt)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 관리자 메모 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">관리자 메모</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Textarea
                        placeholder="CS 처리 내역이나 특이사항을 기록하세요..."
                        value={newMemo}
                        onChange={(e) => setNewMemo(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <Button onClick={handleAddMemo} disabled={!newMemo.trim()} size="sm">
                        메모 추가
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {mockAdminMemos.map((memo) => (
                        <div key={memo.id} className="p-4 border rounded-lg bg-muted/20">
                          <p className="text-sm mb-2">{memo.content}</p>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">{memo.author}</span> • {formatDate(memo.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="learning" className="space-y-6 mt-0">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">수강 내역</CardTitle>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      권한 부여
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>강의명</TableHead>
                          <TableHead>상태</TableHead>
                          <TableHead>진도율</TableHead>
                          <TableHead>최근학습</TableHead>
                          <TableHead>관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockEnrollments.map((enrollment) => (
                          <TableRow key={enrollment.id}>
                            <TableCell className="font-medium">{enrollment.courseName}</TableCell>
                            <TableCell>
                              <Badge variant={enrollment.status === '완료' ? 'default' : 'secondary'} className="text-xs">
                                {enrollment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={enrollment.progress} className="w-20 h-2" />
                                <span className="text-sm font-medium">{enrollment.progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(enrollment.lastStudyDate)}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" className="h-8 text-xs">
                                권한회수
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payment" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-900">{mockUserDetail.totalOrders}건</div>
                        <div className="text-sm text-blue-700 mt-1">총 주문</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-900">{formatCurrency(mockUserDetail.totalPayment)}</div>
                        <div className="text-sm text-green-700 mt-1">총 결제금액</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-lg text-purple-900">{formatDate(mockUserDetail.lastOrderDate)}</div>
                        <div className="text-sm text-purple-700 mt-1">최근 주문</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">주문 내역</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>주문일</TableHead>
                          <TableHead>주문번호</TableHead>
                          <TableHead>상품명</TableHead>
                          <TableHead className="text-right">금액</TableHead>
                          <TableHead>상태</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockOrders.map((order) => (
                          <TableRow key={order.id} className="cursor-pointer hover:bg-muted/30">
                            <TableCell className="text-sm">{formatDate(order.date)}</TableCell>
                            <TableCell className="font-mono text-sm text-primary hover:underline">
                              {order.id}
                            </TableCell>
                            <TableCell>{order.productName}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(order.amount)}</TableCell>
                            <TableCell>
                              <Badge variant="default" className="text-xs">{order.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">최근 활동</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockActivityLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{log.activity}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              IP: <span className="font-mono">{log.ip}</span>
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
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};