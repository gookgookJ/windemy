import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Edit, Lock, MessageCircle, User, BookOpen, CreditCard, Activity, Plus, X, Copy, Phone, Mail, Calendar, MapPin, Clock, TrendingUp, AlertCircle, CheckCircle, MoreHorizontal, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

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
    enrolledDate: '2024-01-20T09:00:00Z', // 결제일(수강 시작일)
    expiryDate: '2024-07-20T23:59:59Z', // 수강 만료일
    orderId: 'ORDER002', // 주문 번호
    lastStudyDate: '2024-03-20T10:00:00Z',
    certificateIssued: false
  },
  {
    id: '2',
    courseName: 'React 심화 과정',
    status: '완료',
    progress: 100,
    enrolledDate: '2024-02-20T14:00:00Z',
    expiryDate: '2024-08-20T23:59:59Z',
    orderId: 'ORDER001',
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
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  if (!userId) return null;

  const handleAddMemo = () => {
    if (newMemo.trim()) {
      console.log('새 메모 추가:', newMemo);
      setNewMemo('');
      toast({
        title: "메모가 추가되었습니다",
        description: "관리자 메모가 성공적으로 저장되었습니다.",
      });
    }
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label}이(가) 복사되었습니다`,
      description: text,
    });
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
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden flex flex-col bg-background">
        {/* Enhanced Header */}
        <DialogHeader className="border-b bg-muted/20 pb-6 pt-6 px-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{mockUserDetail.name}</h1>
                  <Badge variant={mockUserDetail.status === 'active' ? 'default' : 'secondary'} className="h-6 px-3">
                    {mockUserDetail.status === 'active' ? '✅ 정상회원' : '⏸️ 휴면회원'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{mockUserDetail.email}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0 ml-1"
                      onClick={() => handleCopyToClipboard(mockUserDetail.email, '이메일')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{mockUserDetail.phone}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0 ml-1"
                      onClick={() => handleCopyToClipboard(mockUserDetail.phone, '연락처')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-mono">{mockUserDetail.memberId}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-bold text-green-600">{formatCurrency(mockUserDetail.totalPayment)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-9 gap-2">
                <MessageCircle className="h-4 w-4" />
                메시지 발송
              </Button>
              <Button size="sm" className="h-9 gap-2">
                <Edit className="h-4 w-4" />
                정보 수정
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Enhanced Content */}
        <div className="flex-1 overflow-hidden min-h-0 px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mb-4 bg-muted/30 flex-shrink-0 h-12">
              <TabsTrigger value="profile" className="flex items-center gap-2 font-medium data-[state=active]:bg-background h-10">
                <User className="h-4 w-4" />
                회원 정보
              </TabsTrigger>
              <TabsTrigger value="learning" className="flex items-center gap-2 font-medium data-[state=active]:bg-background h-10">
                <BookOpen className="h-4 w-4" />
                수강 내역
                <Badge variant="secondary" className="text-xs h-5">{mockEnrollments.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2 font-medium data-[state=active]:bg-background h-10">
                <CreditCard className="h-4 w-4" />
                결제 정보
                <Badge variant="secondary" className="text-xs h-5">{mockUserDetail.totalOrders}</Badge>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2 font-medium data-[state=active]:bg-background h-10">
                <Activity className="h-4 w-4" />
                활동 로그
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-2 min-h-0 space-y-6">
              <TabsContent value="profile" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Essential Stats Only */}
                  <Card className="lg:col-span-3">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        핵심 현황
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{mockEnrollments.filter(e => e.status === '완료').length}/{mockEnrollments.length}</div>
                          <div className="text-sm text-green-700 mt-1">완료 강의</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{formatCurrency(mockUserDetail.totalPayment)}</div>
                          <div className="text-sm text-blue-700 mt-1">총 결제액</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{Math.floor((new Date().getTime() - new Date(mockUserDetail.lastLogin).getTime()) / (1000 * 60 * 60 * 24))}일 전</div>
                          <div className="text-sm text-orange-700 mt-1">최근 접속</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 기본 정보 */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        기본 정보
                      </CardTitle>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(!isEditing)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {isEditing ? '저장' : '편집'}
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="grid grid-cols-3 gap-3 items-center">
                            <span className="text-sm font-medium text-muted-foreground">이름</span>
                            {isEditing ? (
                              <Input className="col-span-2" defaultValue={mockUserDetail.name} />
                            ) : (
                              <span className="col-span-2 font-medium">{mockUserDetail.name}</span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 items-center">
                            <span className="text-sm font-medium text-muted-foreground">연락처</span>
                            {isEditing ? (
                              <Input className="col-span-2" defaultValue={mockUserDetail.phone} />
                            ) : (
                              <span className="col-span-2 font-medium">{mockUserDetail.phone}</span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 items-center">
                            <span className="text-sm font-medium text-muted-foreground">가입일</span>
                            <span className="col-span-2 text-sm">{format(new Date(mockUserDetail.joinDate), 'yyyy-MM-dd', { locale: ko })}</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 items-center">
                            <span className="text-sm font-medium text-muted-foreground">최근접속</span>
                            <div className="col-span-2 flex items-center gap-2">
                              <span className="text-sm">{format(new Date(mockUserDetail.lastLogin), 'MM-dd HH:mm', { locale: ko })}</span>
                              <Badge variant="outline" className="text-xs font-mono">{mockUserDetail.lastLoginIp}</Badge>
                            </div>
                          </div>
                        </div>
                    </CardContent>
                  </Card>

                  {/* 마케팅 & 권한 정보 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        마케팅 & 권한 설정
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">이메일 수신</span>
                          </div>
                          <Badge variant={mockUserDetail.marketingEmail ? 'default' : 'secondary'} className="text-xs">
                            {mockUserDetail.marketingEmail ? '동의' : '거부'}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground pl-3">
                          마지막 변경: {formatDate(mockUserDetail.marketingEmailChangedAt)}
                        </div>
                        
                        <div className="pt-2 border-t">
                          <Button size="sm" variant="outline" className="w-full">
                            <Lock className="h-4 w-4 mr-2" />
                            권한 설정 변경
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 관리자 메모 - 전체 너비 */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      관리자 메모 <Badge variant="secondary" className="text-xs">{mockAdminMemos.length}</Badge>
                    </CardTitle>
                    <Button size="sm" onClick={handleAddMemo} disabled={!newMemo.trim()}>
                      <Plus className="h-4 w-4 mr-2" />
                      메모 추가
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="CS 처리 내역이나 특이사항을 기록하세요... (Ctrl+Enter로 빠른 저장)"
                      value={newMemo}
                      onChange={(e) => setNewMemo(e.target.value)}
                      rows={3}
                      className="resize-none"
                      onKeyDown={(e) => {
                        if (e.ctrlKey && e.key === 'Enter') {
                          handleAddMemo();
                        }
                      }}
                    />
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {mockAdminMemos.map((memo) => (
                        <div key={memo.id} className="p-4 border rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
                          <p className="text-sm mb-2 leading-relaxed">{memo.content}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="font-medium">{memo.author}</span>
                            <span>{formatDate(memo.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="learning" className="space-y-6 mt-0">
                {/* 수강 통계 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-900">{mockEnrollments.length}개</div>
                        <div className="text-sm text-blue-700 mt-1">전체 수강</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-900">{mockEnrollments.filter(e => e.status === '완료').length}개</div>
                        <div className="text-sm text-green-700 mt-1">완료</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-900">{mockEnrollments.filter(e => e.status === '수강중').length}개</div>
                        <div className="text-sm text-orange-700 mt-1">진행중</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-900">{mockEnrollments.reduce((sum, e) => sum + e.progress, 0) / mockEnrollments.length}%</div>
                        <div className="text-sm text-purple-700 mt-1">평균 진도</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      수강 내역 관리
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        권한 부여
                      </Button>
                      <Button size="sm" variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        필터
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>강의명</TableHead>
                          <TableHead>상태</TableHead>
                          <TableHead>진도율</TableHead>
                          <TableHead>최근학습</TableHead>
                          <TableHead>인증서</TableHead>
                          <TableHead className="text-right">관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockEnrollments.map((enrollment) => (
                          <TableRow key={enrollment.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium">{enrollment.courseName}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={enrollment.status === '완료' ? 'default' : 'secondary'} 
                                className="text-xs flex items-center gap-1 w-fit"
                              >
                                {enrollment.status === '완료' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                {enrollment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Progress value={enrollment.progress} className="w-24 h-2" />
                                <span className="text-sm font-medium min-w-[3rem]">{enrollment.progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(enrollment.lastStudyDate)}</TableCell>
                            <TableCell>
                              {enrollment.certificateIssued ? (
                                <Badge variant="outline" className="text-xs text-green-600">발급완료</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">미발급</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button size="sm" variant="outline" className="h-8 px-3">
                                  연장
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 px-3 text-destructive hover:text-destructive">
                                  회수
                                </Button>
                              </div>
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