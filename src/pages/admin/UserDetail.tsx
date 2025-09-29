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
  payment_method?: string | null;
  stripe_payment_intent_id?: string | null;
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

  const handleDeleteComment = async (commentId: string, noteId: string) => {
    try {
      const { error } = await supabase
        .from('admin_note_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Update the note by removing the comment
      setAdminNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === noteId
            ? { ...note, comments: note.comments?.filter(comment => comment.id !== commentId) || [] }
            : note
        )
      );
      
      toast({
        title: "댓글이 삭제되었습니다",
        description: "관리자 메모 댓글이 성공적으로 삭제되었습니다.",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "댓글 삭제 실패",
        description: "댓글을 삭제하는데 실패했습니다.",
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
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2 text-primary">
                      <MessageCircle className="h-5 w-5" />
                      관리자 메모
                    </CardTitle>
                    <Button 
                      size="sm" 
                      onClick={handleAddMemo} 
                      disabled={!newMemo.trim()}
                      className="shadow-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      메모 추가
                    </Button>
                  </div>
                  <Textarea
                    placeholder="새 관리자 메모를 입력하세요... (Ctrl+Enter로 빠른 저장)"
                    value={newMemo}
                    onChange={(e) => setNewMemo(e.target.value)}
                    rows={3}
                    className="mt-4 resize-none border-2 focus:border-primary/30"
                    onKeyDown={(e) => {
                      if (e.ctrlKey && e.key === 'Enter') {
                        handleAddMemo();
                      }
                    }}
                  />
                </CardHeader>
                <CardContent>
                  {adminNotes.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="w-20 h-20 mx-auto mb-4 bg-muted/20 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-8 w-8 opacity-50" />
                      </div>
                      <h3 className="font-medium mb-2">관리자 메모가 없습니다</h3>
                      <p className="text-sm">위에서 첫 번째 메모를 작성해보세요.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {adminNotes.map((memo, index) => (
                        <div key={memo.id} className="relative">
                          {/* Timeline connector */}
                          {index !== adminNotes.length - 1 && (
                            <div className="absolute left-4 top-12 bottom-0 w-px bg-border z-0" />
                          )}
                          
                          <div className="relative bg-card border-2 border-border/50 rounded-xl p-6 hover:border-primary/20 hover:shadow-md transition-all duration-200">
                            {/* Timeline dot */}
                            <div className="absolute -left-2 top-6 w-4 h-4 bg-primary rounded-full border-2 border-background z-10" />
                            
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-primary">
                                    {memo.created_by_profile?.full_name?.charAt(0) || 'A'}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">
                                    {memo.created_by_profile?.full_name || '관리자'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(memo.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteMemo(memo.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="bg-muted/30 rounded-lg p-4 mb-4">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{memo.note}</p>
                            </div>

                            {/* Comments Section */}
                            {memo.comments && memo.comments.length > 0 && (
                              <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                  <Reply className="h-3 w-3" />
                                  댓글 {memo.comments.length}개
                                </div>
                                {memo.comments.map((comment) => (
                                  <div key={comment.id} className="bg-background/80 border rounded-lg p-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start gap-2 flex-1">
                                        <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                                          <span className="text-xs font-medium">
                                            {comment.created_by_profile?.full_name?.charAt(0) || 'A'}
                                          </span>
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm leading-relaxed">{comment.comment_text}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-muted-foreground">
                                              {comment.created_by_profile?.full_name || '관리자'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">•</span>
                                            <span className="text-xs text-muted-foreground">
                                              {format(new Date(comment.created_at), 'MM-dd HH:mm', { locale: ko })}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDeleteComment(comment.id, memo.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Comment */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="댓글 추가..."
                                value={newComment[memo.id] || ''}
                                onChange={(e) => setNewComment(prev => ({ ...prev, [memo.id]: e.target.value }))}
                                className="flex-1 px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:border-primary/30"
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
                                className="px-3"
                              >
                                <Reply className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'learning' && (
              <div className="space-y-6">
                {enrollments.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-6 bg-muted/20 rounded-full flex items-center justify-center">
                        <BookOpen className="h-10 w-10 opacity-50 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">수강 내역이 없습니다</h3>
                      <p className="text-muted-foreground">아직 등록된 강의가 없습니다.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {enrollments.map((enrollment) => (
                      <Card key={enrollment.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-200">
                        <CardContent className="p-0">
                          <div className="flex">
                            {/* Course Status Indicator */}
                            <div className={`w-1 ${enrollment.completed_at ? 'bg-green-500' : enrollment.progress && enrollment.progress > 0 ? 'bg-blue-500' : 'bg-muted'}`} />
                            
                            <div className="flex-1 p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold">{enrollment.course?.title || '강의명 없음'}</h3>
                                    <Badge 
                                      variant={enrollment.completed_at ? 'default' : enrollment.progress && enrollment.progress > 0 ? 'secondary' : 'outline'}
                                      className="text-xs"
                                    >
                                      {enrollment.completed_at ? (
                                        <>
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          수료완료
                                        </>
                                      ) : enrollment.progress && enrollment.progress > 0 ? (
                                        <>
                                          <TrendingUp className="w-3 h-3 mr-1" />
                                          수강중
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="w-3 h-3 mr-1" />
                                          미시작
                                        </>
                                      )}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div className="bg-muted/30 rounded-lg p-3">
                                      <p className="text-xs text-muted-foreground mb-1">등록일</p>
                                      <p className="font-medium text-sm">
                                        {enrollment.enrolled_at 
                                          ? format(new Date(enrollment.enrolled_at), 'yyyy-MM-dd', { locale: ko })
                                          : '-'
                                        }
                                      </p>
                                    </div>
                                    
                                    <div className="bg-muted/30 rounded-lg p-3">
                                      <p className="text-xs text-muted-foreground mb-1">진도율</p>
                                      <p className="font-bold text-sm text-primary">
                                        {Math.round(enrollment.progress || 0)}%
                                      </p>
                                    </div>
                                    
                                    <div className="bg-muted/30 rounded-lg p-3">
                                      <p className="text-xs text-muted-foreground mb-1">수료일</p>
                                      <p className="font-medium text-sm">
                                        {enrollment.completed_at 
                                          ? format(new Date(enrollment.completed_at), 'yyyy-MM-dd', { locale: ko })
                                          : '-'
                                        }
                                      </p>
                                    </div>
                                    
                                    <div className="bg-muted/30 rounded-lg p-3">
                                      <p className="text-xs text-muted-foreground mb-1">강의 ID</p>
                                      <p className="font-mono text-xs text-muted-foreground truncate">
                                        {enrollment.course_id}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Progress Bar */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium">학습 진행률</span>
                                      <span className="text-sm text-muted-foreground">
                                        {Math.round(enrollment.progress || 0)}% 완료
                                      </span>
                                    </div>
                                    <Progress 
                                      value={enrollment.progress || 0} 
                                      className="h-3"
                                      style={{
                                        background: 'var(--muted)',
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'payment' && (
              <div className="space-y-6">
                {orders.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-6 bg-muted/20 rounded-full flex items-center justify-center">
                        <CreditCard className="h-10 w-10 opacity-50 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">결제 내역이 없습니다</h3>
                      <p className="text-muted-foreground">아직 결제한 주문이 없습니다.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {orders.map((order, index) => (
                      <Card key={order.id} className="border-0 shadow-md overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                <span className="font-bold text-primary">#{index + 1}</span>
                              </div>
                              <div>
                                <CardTitle className="text-lg">주문 #{order.id.slice(0, 8)}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {order.created_at && format(new Date(order.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}
                                className="text-sm px-3 py-1"
                              >
                                {order.status === 'completed' ? '결제완료' : 
                                 order.status === 'pending' ? '결제대기' : 
                                 order.status === 'failed' ? '결제실패' : order.status}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-6">
                          {/* Payment Summary */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-muted/30 rounded-lg p-4">
                              <p className="text-xs text-muted-foreground mb-1">총 결제금액</p>
                              <p className="text-xl font-bold text-primary">
                                {formatCurrency(order.total_amount)}
                              </p>
                            </div>
                            
                            <div className="bg-muted/30 rounded-lg p-4">
                              <p className="text-xs text-muted-foreground mb-1">결제수단</p>
                              <p className="font-medium">
                                {order.payment_method || '카드결제'}
                              </p>
                            </div>
                            
                            <div className="bg-muted/30 rounded-lg p-4">
                              <p className="text-xs text-muted-foreground mb-1">주문 ID</p>
                              <div className="flex items-center gap-2">
                                <p className="font-mono text-xs text-muted-foreground truncate flex-1">
                                  {order.id}
                                </p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleCopyToClipboard(order.id, '주문 ID')}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="bg-muted/30 rounded-lg p-4">
                              <p className="text-xs text-muted-foreground mb-1">PG 거래번호</p>
                              <div className="flex items-center gap-2">
                                <p className="font-mono text-xs text-muted-foreground truncate flex-1">
                                  {order.stripe_payment_intent_id ? order.stripe_payment_intent_id.slice(0, 20) + '...' : '-'}
                                </p>
                                {order.stripe_payment_intent_id && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleCopyToClipboard(order.stripe_payment_intent_id || '', 'PG 거래번호')}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              주문 강의 ({order.order_items?.length || 0}개)
                            </h4>
                            <div className="space-y-3">
                              {order.order_items?.map((item, index) => (
                                <div key={index} className="flex items-center justify-between bg-muted/20 border border-border/50 rounded-lg p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                      <BookOpen className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{item.course?.title || '강의명 없음'}</p>
                                      <p className="text-xs text-muted-foreground">강의 ID: {item.course_id}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-primary">{formatCurrency(item.price || 0)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3 mt-6 pt-4 border-t">
                            <Button size="sm" variant="outline" className="flex-1">
                              <Copy className="h-4 w-4 mr-2" />
                              영수증 다운로드
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Edit className="h-4 w-4 mr-2" />
                              환불 처리
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              <CreditCard className="h-4 w-4 mr-2" />
                              결제 상세보기
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'activity' && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-primary">
                    <Activity className="h-5 w-5" />
                    활동 로그
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    사용자의 최근 활동 기록을 확인할 수 있습니다.
                  </p>
                </CardHeader>
                <CardContent>
                  {activityLogs.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-6 bg-muted/20 rounded-full flex items-center justify-center">
                        <Activity className="h-10 w-10 opacity-50 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">활동 로그가 없습니다</h3>
                      <p className="text-muted-foreground">아직 기록된 활동이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activityLogs.map((log, index) => (
                        <div key={log.id} className="relative">
                          {/* Timeline connector */}
                          {index !== activityLogs.length - 1 && (
                            <div className="absolute left-4 top-12 bottom-0 w-px bg-border z-0" />
                          )}
                          
                          <div className="relative flex items-start gap-4 p-4 bg-card border border-border/50 rounded-lg hover:border-primary/20 transition-colors">
                            {/* Timeline dot */}
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                              <Activity className="h-4 w-4 text-primary" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-medium text-sm">
                                    {log.action}
                                    {log.entity_type && (
                                      <span className="text-muted-foreground"> ({log.entity_type})</span>
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(log.created_at), 'yyyy년 MM월 dd일 HH:mm:ss', { locale: ko })}
                                  </p>
                                </div>
                                
                                {log.ip_address && (
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">IP 주소</p>
                                    <p className="font-mono text-xs">{String(log.ip_address)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
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