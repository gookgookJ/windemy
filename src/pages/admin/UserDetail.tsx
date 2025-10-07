import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, MessageCircle, User, BookOpen, CreditCard, Activity, Plus, Copy, Phone, Mail, Trash2, Reply } from 'lucide-react';
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
  payment_method?: string | null;
  order_items: Array<{
    course_id: string;
    price?: number | null;
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
        // Generate user number
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
        const notesWithProfiles = await Promise.all(
          notes.map(async (note) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', note.created_by)
              .single();
            
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
          });
        }
      } catch (error) {
        console.error('Error adding memo:', error);
        toast({
          title: "메모 추가 실패",
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
      });
    } catch (error) {
      console.error('Error deleting memo:', error);
      toast({
        title: "메모 삭제 실패",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string, noteId: string) => {
    try {
      const { error } = await supabase
        .from('admin_note_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setAdminNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === noteId
            ? { ...note, comments: note.comments?.filter(comment => comment.id !== commentId) || [] }
            : note
        )
      );
      
      toast({
        title: "댓글이 삭제되었습니다",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "댓글 삭제 실패",
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
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        const commentWithProfile = {
          ...data,
          created_by_profile: profile
        };
        
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
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "댓글 추가 실패",
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
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/users')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-xl font-semibold">사용자 상세정보</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-muted-foreground">로딩 중...</div>
          </div>
        ) : (
          <>
            {/* User Summary Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{userData?.full_name || '이름 없음'}</h2>
                      <p className="text-sm text-muted-foreground font-mono">{userNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{userData?.email || '-'}</span>
                    {userData?.email && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0"
                        onClick={() => handleCopyToClipboard(userData.email, '이메일')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{userData?.phone || '-'}</span>
                    {userData?.phone && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0"
                        onClick={() => handleCopyToClipboard(userData.phone, '연락처')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">가입일</p>
                    <p className="text-sm font-medium">
                      {userData?.created_at ? format(new Date(userData.created_at), 'yyyy.MM.dd', { locale: ko }) : '-'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">총 결제</p>
                    <p className="text-sm font-semibold">{formatCurrency(totalPayment)}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">수강 강의</p>
                    <p className="text-sm font-medium">{enrollments.length}개</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">마케팅 수신</p>
                    <p className="text-sm font-medium">
                      {userData?.marketing_consent ? '동의' : '거부'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <div className="border-b">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveSection('profile')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeSection === 'profile'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <MessageCircle className="h-4 w-4 inline mr-2" />
                  관리자 메모
                </button>
                <button
                  onClick={() => setActiveSection('learning')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeSection === 'learning'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <BookOpen className="h-4 w-4 inline mr-2" />
                  수강 내역
                </button>
                <button
                  onClick={() => setActiveSection('payment')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeSection === 'payment'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CreditCard className="h-4 w-4 inline mr-2" />
                  결제 정보
                </button>
                <button
                  onClick={() => setActiveSection('activity')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeSection === 'activity'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Activity className="h-4 w-4 inline mr-2" />
                  활동 로그
                </button>
              </div>
            </div>

            {/* Content Sections */}
            {activeSection === 'profile' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">관리자 메모</CardTitle>
                    <Button 
                      size="sm" 
                      onClick={handleAddMemo} 
                      disabled={!newMemo.trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      추가
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="새 메모 입력..."
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

                  {adminNotes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">메모가 없습니다</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {adminNotes.map((memo) => (
                        <div key={memo.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {memo.created_by_profile?.full_name?.charAt(0) || 'A'}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {memo.created_by_profile?.full_name || '관리자'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(memo.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleDeleteMemo(memo.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          <p className="text-sm mb-3 whitespace-pre-wrap">{memo.note}</p>

                          {/* Comments */}
                          {memo.comments && memo.comments.length > 0 && (
                            <div className="space-y-2 mb-3 pl-4 border-l-2">
                              {memo.comments.map((comment) => (
                                <div key={comment.id} className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm">{comment.comment_text}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {comment.created_by_profile?.full_name || '관리자'} · {format(new Date(comment.created_at), 'MM.dd HH:mm', { locale: ko })}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0"
                                    onClick={() => handleDeleteComment(comment.id, memo.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Comment */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="댓글 입력..."
                              value={newComment[memo.id] || ''}
                              onChange={(e) => setNewComment(prev => ({ ...prev, [memo.id]: e.target.value }))}
                              className="flex-1 px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddComment(memo.id);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAddComment(memo.id)}
                              disabled={!newComment[memo.id]?.trim()}
                            >
                              <Reply className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'learning' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">수강 내역</CardTitle>
                </CardHeader>
                <CardContent>
                  {enrollments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">수강 내역이 없습니다</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {enrollments.map((enrollment) => (
                        <div key={enrollment.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-medium mb-1">{enrollment.course?.title || '강의명 없음'}</h3>
                              <Badge 
                                variant={enrollment.completed_at ? 'default' : enrollment.progress && enrollment.progress > 0 ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                {enrollment.completed_at ? '수료완료' : enrollment.progress && enrollment.progress > 0 ? '수강중' : '미시작'}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">등록일</p>
                              <p className="text-sm font-medium">
                                {enrollment.enrolled_at 
                                  ? format(new Date(enrollment.enrolled_at), 'yyyy.MM.dd', { locale: ko })
                                  : '-'
                                }
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">진도율</p>
                              <p className="text-sm font-semibold">
                                {Math.round(enrollment.progress || 0)}%
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">수료일</p>
                              <p className="text-sm font-medium">
                                {enrollment.completed_at 
                                  ? format(new Date(enrollment.completed_at), 'yyyy.MM.dd', { locale: ko })
                                  : '-'
                                }
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>진행률</span>
                              <span className="font-medium">{Math.round(enrollment.progress || 0)}%</span>
                            </div>
                            <Progress value={enrollment.progress || 0} className="h-1.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'payment' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">결제 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">결제 내역이 없습니다</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">총 결제액</p>
                          <p className="text-lg font-semibold">{formatCurrency(totalPayment)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">주문 수</p>
                          <p className="text-lg font-semibold">{orders.length}건</p>
                        </div>
                      </div>

                      {/* Orders List */}
                      <div className="space-y-3">
                        {orders.map((order) => (
                          <div key={order.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-sm font-medium mb-1">
                                  {order.created_at 
                                    ? format(new Date(order.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })
                                    : '-'
                                  }
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={order.status === 'completed' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {order.status === 'completed' ? '완료' : order.status || '대기'}
                                  </Badge>
                                  {order.payment_method && (
                                    <span className="text-xs text-muted-foreground">
                                      {order.payment_method}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm font-semibold">{formatCurrency(order.total_amount)}</p>
                            </div>
                            
                            <div className="space-y-1">
                              {order.order_items.map((item, idx) => (
                                <p key={idx} className="text-sm text-muted-foreground">
                                  · {item.course?.title || '강의명 없음'}
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'activity' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">활동 로그</CardTitle>
                </CardHeader>
                <CardContent>
                  {activityLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">활동 로그가 없습니다</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activityLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{log.action}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {log.entity_type && (
                                <Badge variant="outline" className="text-xs">
                                  {log.entity_type}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(log.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                              </span>
                            </div>
                          </div>
                          {log.ip_address && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {String(log.ip_address)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
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
