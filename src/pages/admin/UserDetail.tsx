import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, MessageCircle, User, BookOpen, CreditCard, Activity, Plus, Copy, Phone, Mail, Calendar, Clock, TrendingUp, CheckCircle, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

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
    enrolledDate: '2024-01-20T09:00:00Z',
    expiryDate: '2024-07-20T23:59:59Z',
    orderId: 'ORDER002',
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

export const AdminUserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [newMemo, setNewMemo] = useState('');
  const [activeSection, setActiveSection] = useState('memo');
  const { toast } = useToast();

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  if (!userId) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">사용자를 찾을 수 없습니다</h1>
            <Button 
              onClick={() => navigate('/admin/users')} 
              className="mt-4"
            >
              사용자 목록으로 돌아가기
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 border-b border-border/30 pb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/admin/users')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            사용자 목록
          </Button>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">사용자 상세 정보</h1>
            <p className="text-muted-foreground mt-1">회원의 상세 정보와 활동 이력을 확인하고 관리할 수 있습니다</p>
          </div>
        </div>

        {/* User Info Header */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">{mockUserDetail.name}</h2>
                    <Badge variant="outline" className="text-xs font-mono bg-primary/10 text-primary">{mockUserDetail.memberId}</Badge>
                  </div>
                  
                  {/* Contact Info */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{mockUserDetail.email}</span>
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
                      <span className="font-medium text-sm">{mockUserDetail.phone}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0 ml-1"
                        onClick={() => handleCopyToClipboard(mockUserDetail.phone, '연락처')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Key Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground">가입일</span>
                        <div className="font-medium">{format(new Date(mockUserDetail.joinDate), 'yyyy-MM-dd', { locale: ko })}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground">최근접속</span>
                        <div className="font-medium">{format(new Date(mockUserDetail.lastLogin), 'MM-dd HH:mm', { locale: ko })}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <div>
                        <span className="text-muted-foreground">총 결제</span>
                        <div className="font-bold text-green-600">{formatCurrency(mockUserDetail.totalPayment)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground">마케팅 수신</span>
                        <div className={`font-medium ${mockUserDetail.marketingEmail ? 'text-green-600' : 'text-red-600'}`}>
                          {mockUserDetail.marketingEmail ? '동의' : '거부'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                정보 수정
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-2 bg-muted/30 p-2 rounded-lg">
          <Button 
            variant={activeSection === 'memo' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setActiveSection('memo')}
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            관리자 메모
          </Button>
          <Button 
            variant={activeSection === 'learning' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setActiveSection('learning')}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            수강 내역 ({mockEnrollments.length})
          </Button>
          <Button 
            variant={activeSection === 'payment' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setActiveSection('payment')}
            className="gap-2"
          >
            <CreditCard className="h-4 w-4" />
            결제 정보 ({mockUserDetail.totalOrders})
          </Button>
          <Button 
            variant={activeSection === 'activity' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setActiveSection('activity')}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            활동 로그
          </Button>
        </div>

        {/* Content Sections */}
        {activeSection === 'memo' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
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
              
              <div className="space-y-3">
                {mockAdminMemos.map((memo) => (
                  <div key={memo.id} className="p-4 border rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
                    <p className="text-sm mb-2 leading-relaxed">{memo.content}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium">{memo.author}</span>
                      <span>{format(new Date(memo.createdAt), 'MM-dd HH:mm', { locale: ko })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === 'learning' && (
          <div className="space-y-4">
            {mockEnrollments.map((enrollment) => (
              <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    <div className="lg:col-span-2 space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg">{enrollment.courseName}</h3>
                        <Badge variant={enrollment.status === '완료' ? 'default' : 'secondary'}>
                          {enrollment.status === '완료' ? '완료' : '수강중'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>수강 시작</span>
                          </div>
                          <div className="font-medium">{format(new Date(enrollment.enrolledDate), 'yyyy-MM-dd', { locale: ko })}</div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>만료일</span>
                          </div>
                          <div className={`font-medium ${new Date(enrollment.expiryDate) < new Date() ? 'text-red-600' : new Date(enrollment.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'text-orange-600' : 'text-green-600'}`}>
                            {format(new Date(enrollment.expiryDate), 'yyyy-MM-dd', { locale: ko })}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CreditCard className="h-4 w-4" />
                            <span>주문번호</span>
                          </div>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="h-auto p-0 font-mono text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => setActiveSection('payment')}
                          >
                            {enrollment.orderId}
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                            <span>최근 학습</span>
                          </div>
                          <div className="text-sm">{format(new Date(enrollment.lastStudyDate), 'MM-dd HH:mm', { locale: ko })}</div>
                        </div>
                      </div>
                      
                      {enrollment.certificateIssued && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium text-sm">수료증 발급완료</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">진도율</span>
                        <span className="text-lg font-bold text-primary">{enrollment.progress}%</span>
                      </div>
                      <Progress value={enrollment.progress} className="h-3" />
                      
                      <div className="text-xs text-center">
                        <div className="font-semibold">12/16 강의 완료</div>
                        <div className="text-muted-foreground">총 24시간</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline" className="w-full">
                        상세 현황
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        기간 연장
                      </Button>
                      {enrollment.certificateIssued && (
                        <Button size="sm" variant="outline" className="w-full">
                          수료증 재발급
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeSection === 'payment' && (
          <div className="space-y-4">
            {mockOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                    <div className="space-y-1">
                      <div className="font-mono text-sm text-muted-foreground">{order.id}</div>
                      <div className="font-semibold">{order.productName}</div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(order.date), 'yyyy-MM-dd HH:mm', { locale: ko })}
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatCurrency(order.amount)}</div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
                        {order.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        상세보기
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeSection === 'activity' && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>시간</TableHead>
                    <TableHead>활동</TableHead>
                    <TableHead>IP 주소</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockActivityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.timestamp), 'MM-dd HH:mm', { locale: ko })}
                      </TableCell>
                      <TableCell>{log.activity}</TableCell>
                      <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetail;