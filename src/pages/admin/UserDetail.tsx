import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, MessageCircle, User, BookOpen, CreditCard, Activity, Plus, Copy, Phone, Mail, Calendar, Clock, TrendingUp, CheckCircle, Edit, Trash2, Reply } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  marketing_consent: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AdminNote {
  id: string;
  note: string;
  created_by: string;
  created_at: string;
  created_by_profile?: {
    full_name: string | null;
  } | null;
  comments?: Array<{
    id: string;
    comment_text: string;
    created_by: string;
    created_at: string;
    created_by_profile?: {
      full_name: string | null;
    } | null;
  }>;
}

interface Enrollment {
  id: string;
  course_id: string;
  progress: number | null;
  enrolled_at: string | null;
  completed_at: string | null;
  course: {
    title: string;
    id: string;
  };
}

interface Order {
  id: string;
  created_at: string | null;
  total_amount: number;
  status: string | null;
  order_items: Array<{
    course_id: string;
    course: {
      title: string;
    };
  }>;
}

interface ActivityLog {
  id: string;
  created_at: string;
  action: string;
  entity_type: string | null;
  ip_address: unknown;
}

export const AdminUserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [newMemo, setNewMemo] = useState('');
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [totalPayment, setTotalPayment] = useState(0);
  const [newComment, setNewComment] = useState<{[key: string]: string}>({});
  const [userNumber, setUserNumber] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch user profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setUserData(profile);
        // Generate user number from created_at and id
        const userDate = profile.created_at ? new Date(profile.created_at) : new Date();
        const yearMonth = userDate.getFullYear().toString() + (userDate.getMonth() + 1).toString().padStart(2, '0');
        const shortId = profile.id.replace(/-/g, '').slice(0, 6);
        setUserNumber(`USR${yearMonth}${shortId}`);
      }

      // Fetch admin notes with comments
      const { data: notes } = await supabase
        .from('admin_notes')
        .select(`
          *,
          admin_note_comments (
            id,
            comment_text,
            created_by,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (notes) {
        // Fetch creator names for notes and comments
        const notesWithProfiles = await Promise.all(
          notes.map(async (note) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', note.created_by)
              .single();
            
            // Fetch comment creators
            const commentsWithProfiles = await Promise.all(
              (note.admin_note_comments || []).map(async (comment: any) => {
                const { data: commentProfile } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', comment.created_by)
                  .single();
                
                return {
                  ...comment,
                  created_by_profile: commentProfile
                };
              })
            );
            
            return {
              ...note,
              created_by_profile: profile,
              comments: commentsWithProfiles
            };
          })
        );
        setAdminNotes(notesWithProfiles);
      }

      // Fetch enrollments
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(id, title)
        `)
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false });

      if (enrollmentData) {
        setEnrollments(enrollmentData);
      }

      // Fetch orders
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            course_id,
            course:courses(title)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (orderData) {
        setOrders(orderData);
        // Calculate total payment
        const total = orderData.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        setTotalPayment(total);
      }

      // Fetch activity logs
      const { data: logs } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (logs) {
        setActivityLogs(logs);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "데이터 로드 실패",
        description: "사용자 정보를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemo = async () => {
    if (newMemo.trim() && userId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('admin_notes')
          .insert({
            user_id: userId,
            note: newMemo.trim(),
            created_by: user.id
          })
          .select('*')
          .single();

        if (error) throw error;

        if (data) {
          // Fetch creator profile separately
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          
          const noteWithProfile = {
            ...data,
            created_by_profile: profile
          };
          
          setAdminNotes([noteWithProfile, ...adminNotes]);
          setNewMemo('');
          toast({
            title: "메모가 추가되었습니다",
            description: "관리자 메모가 성공적으로 저장되었습니다.",
          });
        }
      } catch (error) {
        console.error('Error adding memo:', error);
        toast({
          title: "메모 추가 실패",
          description: "메모를 저장하는데 실패했습니다.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteMemo = async (memoId: string) => {
    try {
      const { error } = await supabase
        .from('admin_notes')
        .delete()
        .eq('id', memoId);

      if (error) throw error;

      setAdminNotes(adminNotes.filter(note => note.id !== memoId));
      toast({
        title: "메모가 삭제되었습니다",
        description: "관리자 메모가 성공적으로 삭제되었습니다.",
      });
    } catch (error) {
      console.error('Error deleting memo:', error);
      toast({
        title: "메모 삭제 실패",
        description: "메모를 삭제하는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (noteId: string) => {
    const commentText = newComment[noteId]?.trim();
    if (!commentText) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('admin_note_comments')
        .insert({
          note_id: noteId,
          comment_text: commentText,
          created_by: user.id
        })
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        // Fetch creator profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        const commentWithProfile = {
          ...data,
          created_by_profile: profile
        };
        
        // Update the note with the new comment
        setAdminNotes(prevNotes =>
          prevNotes.map(note =>
            note.id === noteId
              ? { ...note, comments: [...(note.comments || []), commentWithProfile] }
              : note
          )
        );
        
        setNewComment(prev => ({ ...prev, [noteId]: '' }));
        toast({
          title: "댓글이 추가되었습니다",
          description: "관리자 메모에 댓글이 성공적으로 추가되었습니다.",
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "댓글 추가 실패",
        description: "댓글을 추가하는데 실패했습니다.",
        variant: "destructive",
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
    return <div>사용자 ID가 없습니다.</div>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/users')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              사용자 목록으로
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-2xl font-bold">사용자 상세정보</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div>로딩 중...</div>
          </div>
        ) : (
          <>
            {/* User Summary Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold">{userData?.full_name || userData?.email || '사용자'}</h2>
                        <Badge variant="outline" className="text-xs font-mono bg-primary/10 text-primary">
                          {userNumber}
                        </Badge>
                      </div>
                      
                      {/* Contact Info */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{userData?.email || '이메일 없음'}</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 ml-1"
                            onClick={() => handleCopyToClipboard(userData?.email || '', '이메일')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{userData?.phone || '연락처 없음'}</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 ml-1"
                            onClick={() => handleCopyToClipboard(userData?.phone || '', '연락처')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Essential Info Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-4 bg-background/50 rounded-lg border">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">가입일</span>
                          </div>
                          <div className="font-medium">
                            {userData?.created_at ? format(new Date(userData.created_at), 'yyyy-MM-dd', { locale: ko }) : '-'}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">정보 수정</span>
                          </div>
                          <div className="font-medium">
                            {userData?.updated_at ? format(new Date(userData.updated_at), 'MM-dd HH:mm', { locale: ko }) : '-'}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-green-600">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm text-muted-foreground">총 결제</span>
                          </div>
                          <div className="font-bold text-green-600 text-lg">{formatCurrency(totalPayment)}</div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span className="text-sm">마케팅 수신</span>
                          </div>
                          <div className={`font-medium ${userData?.marketing_consent ? 'text-green-600' : 'text-red-600'}`}>
                            {userData?.marketing_consent ? '동의' : '거부'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button size="sm" className="h-9 gap-2">
                    <Edit className="h-4 w-4" />
                    정보 수정
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex gap-2 border-b">
              <Button 
                variant={activeSection === 'profile' ? 'default' : 'ghost'} 
                onClick={() => setActiveSection('profile')}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                관리자 메모
              </Button>
              <Button 
                variant={activeSection === 'learning' ? 'default' : 'ghost'} 
                onClick={() => setActiveSection('learning')}
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                수강 내역
              </Button>
              <Button 
                variant={activeSection === 'payment' ? 'default' : 'ghost'} 
                onClick={() => setActiveSection('payment')}
                className="gap-2"
              >
                <CreditCard className="h-4 w-4" />
                결제 정보
              </Button>
              <Button 
                variant={activeSection === 'activity' ? 'default' : 'ghost'} 
                onClick={() => setActiveSection('activity')}
                className="gap-2"
              >
                <Activity className="h-4 w-4" />
                활동 로그
              </Button>
            </div>

            {/* Content Sections */}
            {activeSection === 'profile' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    관리자 메모
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
                    {adminNotes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>등록된 관리자 메모가 없습니다.</p>
                      </div>
                    ) : (
                      adminNotes.map((memo) => (
                        <div key={memo.id} className="border rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
                          <div className="p-4">
                            <p className="text-sm mb-2 leading-relaxed">{memo.note}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="font-medium">
                                {memo.created_by_profile?.full_name || '관리자'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span>{format(new Date(memo.created_at), 'MM-dd HH:mm', { locale: ko })}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                  onClick={() => handleDeleteMemo(memo.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Comments */}
                            {memo.comments && memo.comments.length > 0 && (
                              <div className="mt-3 pl-4 border-l-2 border-primary/20 space-y-2">
                                {memo.comments.map((comment) => (
                                  <div key={comment.id} className="bg-background/50 p-2 rounded text-xs">
                                    <p className="mb-1">{comment.comment_text}</p>
                                    <div className="flex justify-between text-muted-foreground">
                                      <span>{comment.created_by_profile?.full_name || '관리자'}</span>
                                      <span>{format(new Date(comment.created_at), 'MM-dd HH:mm', { locale: ko })}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Add Comment */}
                            <div className="mt-3 flex gap-2">
                              <input
                                type="text"
                                placeholder="댓글 추가..."
                                value={newComment[memo.id] || ''}
                                onChange={(e) => setNewComment(prev => ({ ...prev, [memo.id]: e.target.value }))}
                                className="flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddComment(memo.id);
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => handleAddComment(memo.id)}
                                disabled={!newComment[memo.id]?.trim()}
                              >
                                <Reply className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'learning' && (
              <div className="space-y-4">
                {enrollments.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>수강 내역이 없습니다.</p>
                    </CardContent>
                  </Card>
                ) : (
                  enrollments.map((enrollment) => (
                    <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                          {/* Course Info */}
                          <div className="lg:col-span-2 space-y-3">
                            <div className="flex items-start justify-between">
                              <h3 className="font-semibold text-lg">{enrollment.course?.title || '강의명 없음'}</h3>
                              <Badge variant={enrollment.completed_at ? 'default' : 'secondary'}>
                                {enrollment.completed_at ? '완료' : '수강중'}
                              </Badge>
                            </div>
                            
                            {/* Key Information */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  <span>수강 시작</span>
                                </div>
                                <div className="font-medium">
                                  {enrollment.enrolled_at ? format(new Date(enrollment.enrolled_at), 'yyyy-MM-dd', { locale: ko }) : '-'}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>완료일</span>
                                </div>
                                <div className={`font-medium ${enrollment.completed_at ? 'text-green-600' : 'text-muted-foreground'}`}>
                                  {enrollment.completed_at ? format(new Date(enrollment.completed_at), 'yyyy-MM-dd', { locale: ko }) : '수강 중'}
                                </div>
                              </div>
                            </div>
                            
                            {enrollment.completed_at && (
                              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                                <CheckCircle className="h-4 w-4" />
                                <span className="font-medium text-sm">수강 완료</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Progress */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">진도율</span>
                              <span className="text-lg font-bold text-primary">{enrollment.progress || 0}%</span>
                            </div>
                            <Progress value={enrollment.progress || 0} className="h-3" />
                            
                            <div className="text-xs text-center">
                              <div className="font-semibold">진행률</div>
                              <div className="text-muted-foreground">{enrollment.progress || 0}% 완료</div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => window.open(`/admin/courses/${enrollment.course_id}`, '_blank')}
                            >
                              강의 관리
                            </Button>
                            <Button size="sm" variant="outline" className="w-full">
                              기간 연장
                            </Button>
                            {enrollment.completed_at && (
                              <Button size="sm" variant="outline" className="w-full">
                                수료증 발급
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeSection === 'payment' && (
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>결제 내역이 없습니다.</p>
                    </CardContent>
                  </Card>
                ) : (
                  orders.map((order) => (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                          <div className="space-y-1">
                            <div className="font-mono text-sm text-muted-foreground">{order.id.slice(0, 8)}...</div>
                            <div className="font-semibold">
                              {order.order_items?.[0]?.course?.title || '강의명 없음'}
                              {order.order_items && order.order_items.length > 1 && 
                                ` 외 ${order.order_items.length - 1}개`
                              }
                            </div>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            {order.created_at ? format(new Date(order.created_at), 'yyyy-MM-dd HH:mm', { locale: ko }) : '-'}
                          </div>
                          
                          <div className="text-right">
                            <div className="font-bold text-lg">{formatCurrency(order.total_amount)}</div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge 
                              variant={order.status === 'completed' ? 'default' : 'secondary'}
                              className={order.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            >
                              {order.status === 'completed' ? '결제완료' : 
                               order.status === 'pending' ? '결제대기' : 
                               order.status || '미확인'}
                            </Badge>
                            <Button size="sm" variant="outline">
                              상세보기
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeSection === 'activity' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">활동 로그</CardTitle>
                </CardHeader>
                <CardContent>
                  {activityLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>활동 로그가 없습니다.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>시간</TableHead>
                          <TableHead>활동</TableHead>
                          <TableHead>IP 주소</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activityLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">
                              {format(new Date(log.created_at), 'MM-dd HH:mm', { locale: ko })}
                            </TableCell>
                            <TableCell>{log.action} {log.entity_type && `(${log.entity_type})`}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.ip_address ? String(log.ip_address) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetail;