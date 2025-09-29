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
                    placeholder="관리자 메모를 입력하세요..."
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
                            
                            {memo.comments && memo.comments.length > 0 && (
                              <div className="mt-3 pl-4 border-l-2 border-primary/20 space-y-2">
                                {memo.comments.map((comment) => (
                                  <div key={comment.id} className="bg-background/50 p-2 rounded text-xs">
                                    <p className="mb-1">{comment.comment_text}</p>
                                    <div className="flex justify-between items-center text-muted-foreground">
                                      <span>{comment.created_by_profile?.full_name || '관리자'}</span>
                                      <div className="flex items-center gap-2">
                                        <span>{format(new Date(comment.created_at), 'MM-dd HH:mm', { locale: ko })}</span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                                          onClick={() => handleDeleteComment(comment.id, memo.id)}
                                        >
                                          <Trash2 className="h-2 w-2" />
                                        </Button>
                                      </div>
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
                  <div className="space-y-4">
                    {enrollments.map((enrollment) => (
                      <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2">
                                {enrollment.course?.title || '강의명 없음'}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>수강 시작: {enrollment.enrolled_at ? format(new Date(enrollment.enrolled_at), 'yyyy.MM.dd', { locale: ko }) : '-'}</span>
                                </div>
                                {enrollment.completed_at && (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>완료: {format(new Date(enrollment.completed_at), 'yyyy.MM.dd', { locale: ko })}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge variant={enrollment.completed_at ? 'default' : 'secondary'} className={
                              enrollment.completed_at 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : enrollment.progress && enrollment.progress > 0 
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : 'bg-gray-100 text-gray-800 border-gray-200'
                            }>
                              {enrollment.completed_at ? '수강완료' : enrollment.progress && enrollment.progress > 0 ? '수강중' : '미시작'}
                            </Badge>
                          </div>
                          
                          {/* Progress Section */}
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">학습 진도</span>
                              <span className="text-lg font-bold text-primary">{Math.round(enrollment.progress || 0)}%</span>
                            </div>
                            <Progress 
                              value={enrollment.progress || 0} 
                              className="h-2 mb-2" 
                            />
                            <div className="text-xs text-gray-600 text-center">
                              {enrollment.progress === 100 
                                ? '🎉 축하합니다! 모든 학습을 완료했습니다.' 
                                : enrollment.progress && enrollment.progress > 0
                                  ? `${Math.round(enrollment.progress)}% 진행 중입니다. 화이팅!`
                                  : '아직 학습을 시작하지 않았습니다.'}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => window.open(`/learn/${enrollment.course_id}`, '_blank')}
                            >
                              강의 바로가기
                            </Button>
                            {!enrollment.completed_at && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1"
                              >
                                학습 독려 메시지
                              </Button>
                            )}
                            {enrollment.completed_at && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1"
                              >
                                수료증 확인
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">결제 정보 요약</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">총 주문 수</div>
                          <div className="font-bold text-lg">{orders.length}건</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">총 결제 금액</div>
                          <div className="font-bold text-lg text-green-600">{formatCurrency(totalPayment)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">최근 결제일</div>
                          <div className="font-bold text-lg">
                            {orders[0]?.created_at ? format(new Date(orders[0].created_at), 'yyyy.MM.dd', { locale: ko }) : '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {orders.map((order) => (
                      <Card key={order.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Order Header */}
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-sm text-muted-foreground mb-1">주문번호</div>
                                <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{order.id}</div>
                              </div>
                              <Badge 
                                variant={order.status === 'completed' ? 'default' : 'secondary'}
                                className={order.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                              >
                                {order.status === 'completed' ? '결제완료' : 
                                 order.status === 'pending' ? '결제대기' : 
                                 order.status || '미확인'}
                              </Badge>
                            </div>

                            {/* Order Details Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">결제일시</div>
                                <div className="font-medium text-sm">
                                  {order.created_at ? format(new Date(order.created_at), 'yyyy.MM.dd HH:mm', { locale: ko }) : '-'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">결제 금액</div>
                                <div className="font-bold text-lg text-green-600">{formatCurrency(order.total_amount)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">결제 방법</div>
                                <div className="font-medium text-sm">
                                  {order.payment_method === 'free' ? '무료' : 
                                   order.payment_method === 'card' ? '카드' :
                                   order.payment_method === 'bank_transfer' ? '계좌이체' :
                                   order.payment_method || '미확인'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">PG 거래번호</div>
                                <div className="font-mono text-xs">
                                  {order.stripe_payment_intent_id ? order.stripe_payment_intent_id.slice(0, 20) + '...' : '-'}
                                </div>
                              </div>
                            </div>

                            {/* Course Items */}
                            <div>
                              <div className="text-sm font-medium mb-2">주문 강의</div>
                              <div className="space-y-2">
                                {order.order_items?.map((item, index) => (
                                  <div key={index} className="flex items-center justify-between bg-white border rounded-lg p-3">
                                    <div className="flex-1">
                                      <div className="font-medium">{item.course?.title || '강의명 없음'}</div>
                                      <div className="text-xs text-muted-foreground">강의 ID: {item.course_id}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-medium">{formatCurrency(item.price || 0)}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2 border-t">
                              <Button size="sm" variant="outline" className="flex-1">
                                영수증 다운로드
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1">
                                환불 처리
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1">
                                결제 상세보기
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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