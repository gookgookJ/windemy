import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowLeft, MessageCircle, User, BookOpen, CreditCard, Activity, 
  Plus, Copy, Phone, Mail, Trash2, Reply, ChevronDown, ChevronRight, 
  CheckCircle, Clock, Download 
} from 'lucide-react';
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
    category?: {
      name: string;
    } | null;
  };
  sessions?: SessionProgress[];
  downloads?: FileDownload[];
}

interface SessionProgress {
  id: string;
  session_id: string;
  completed: boolean;
  watched_duration_seconds: number;
  session: {
    title: string;
    order_index: number;
    video_duration_seconds?: number;
  };
}

interface FileDownload {
  id: string;
  file_name: string;
  downloaded_at: string;
  session_id: string;
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
  entity_id: string;
  details: any;
  user_id: string;
  ip_address?: unknown;
  user_agent?: unknown;
}

const AdminUserDetail = () => {
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
  const [expandedEnrollment, setExpandedEnrollment] = useState<string | null>(null);
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
          course:courses(
            id, 
            title, 
            thumbnail_url,
            category:categories(name)
          )
        `)
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false });

      if (enrollmentData) {
        // 각 enrollment에 대해 세션별 진도와 다운로드 이력 가져오기
        const enrichedEnrollments = await Promise.all(
          enrollmentData.map(async (enrollment) => {
            // 해당 강의의 세션 ID 목록 가져오기
            const { data: courseSessions } = await supabase
              .from('course_sessions')
              .select('id')
              .eq('course_id', enrollment.course_id);
            
            const sessionIds = courseSessions?.map(s => s.id) || [];

            // 세션별 진도 가져오기
            const { data: sessionProgress } = await supabase
              .from('session_progress')
              .select(`
                id,
                session_id,
                completed,
                watched_duration_seconds,
                session:course_sessions(
                  title, 
                  order_index,
                  video_duration_seconds,
                  section:course_sections(title, order_index)
                )
              `)
              .eq('user_id', userId)
              .in('session_id', sessionIds);

            // 다운로드 이력 가져오기
            const { data: downloads } = await supabase
              .from('session_file_downloads')
              .select('id, file_name, downloaded_at, session_id')
              .eq('user_id', userId)
              .in('session_id', sessionIds)
              .order('downloaded_at', { ascending: false });

            return {
              ...enrollment,
              sessions: sessionProgress || [],
              downloads: downloads || []
            };
          })
        );
        
        setEnrollments(enrichedEnrollments);
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

      // Fetch activity logs (using security function to exclude IP/user agent)
      const { data: logs } = await supabase
        .rpc('get_user_activity_logs', { target_user_id: userId });

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

  // 자동 영상 길이 동기화: 수강 내역 탭 진입 시 실행 (1회)
  const hasAutoSyncedRef = useRef(false);
  useEffect(() => {
    if (activeSection !== 'learning') return;
    if (hasAutoSyncedRef.current) return;

    // 동기화가 필요한 코스 식별 (세션 중 영상 길이가 0 또는 없음)
    const coursesNeedingSync = Array.from(new Set(
      (enrollments || [])
        .filter((e) => (e.sessions || []).some((s) => !((s.session as any)?.video_duration_seconds > 0)))
        .map((e) => e.course_id)
        .filter(Boolean) as string[]
    ));

    if (coursesNeedingSync.length === 0) return;

    hasAutoSyncedRef.current = true;

    (async () => {
      try {
        for (const courseId of coursesNeedingSync) {
          await supabase.functions.invoke('sync-video-durations', {
            body: { course_id: courseId }
          });
          // 약간의 간격으로 호출 (API 과도 호출 방지)
          await new Promise((r) => setTimeout(r, 350));
        }

        toast({
          title: '영상 길이 자동 동기화 완료',
          description: `${coursesNeedingSync.length}개 강의의 영상 길이를 최신화했어요.`,
        });

        // 최신 데이터로 새로고침
        await fetchUserData();
      } catch (err) {
        console.error('Auto sync video durations failed:', err);
      }
    })();
  }, [activeSection, enrollments]);

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
                <CardContent className="p-0">
                  {enrollments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground px-6">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">수강 내역이 없습니다</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {enrollments.map((enrollment) => {
                        const progress = Math.round(enrollment.progress || 0);
                        const isCompleted = !!enrollment.completed_at;
                        const isExpanded = expandedEnrollment === enrollment.id;
                        const completedSessions = enrollment.sessions?.filter(s => s.completed).length || 0;
                        const totalSessions = enrollment.sessions?.length || 0;
                        
                        return (
                          <Collapsible 
                            key={enrollment.id}
                            open={isExpanded}
                            onOpenChange={() => setExpandedEnrollment(isExpanded ? null : enrollment.id)}
                          >
                            <CollapsibleTrigger asChild>
                              <div className="px-6 py-4 hover:bg-muted/30 cursor-pointer transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 flex-1">
                                    {/* Icon */}
                                    <div className="flex-shrink-0">
                                      {isExpanded ? (
                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                      )}
                                    </div>

                                    {/* Title & Category */}
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-sm mb-0.5 truncate">
                                        {enrollment.course?.title || '강의명 없음'}
                                      </h3>
                                      {(enrollment.course as any)?.category?.name && (
                                        <p className="text-xs text-muted-foreground">
                                          {(enrollment.course as any).category.name}
                                        </p>
                                      )}
                                    </div>

                                    {/* Status */}
                                    <div className="flex-shrink-0 w-24">
                                      <Badge 
                                        variant={isCompleted ? 'default' : progress > 0 ? 'secondary' : 'outline'}
                                        className={`text-xs ${isCompleted ? 'bg-green-500 hover:bg-green-600' : ''}`}
                                      >
                                        {isCompleted ? '수료완료' : progress > 0 ? '수강중' : '미시작'}
                                      </Badge>
                                    </div>

                                    {/* Dates */}
                                    <div className="flex-shrink-0 w-24 text-right">
                                      <p className="text-xs text-muted-foreground">등록일</p>
                                      <p className="text-sm font-medium">
                                        {enrollment.enrolled_at 
                                          ? format(new Date(enrollment.enrolled_at), 'yy.MM.dd', { locale: ko })
                                          : '-'
                                        }
                                      </p>
                                    </div>

                                    <div className="flex-shrink-0 w-24 text-right">
                                      <p className="text-xs text-muted-foreground">수료일</p>
                                      <p className="text-sm font-medium">
                                        {enrollment.completed_at 
                                          ? format(new Date(enrollment.completed_at), 'yy.MM.dd', { locale: ko })
                                          : '-'
                                        }
                                      </p>
                                    </div>

                                    {/* Sessions */}
                                    <div className="flex-shrink-0 w-24 text-right">
                                      <p className="text-xs text-muted-foreground">완료 세션</p>
                                      <p className="text-sm font-medium">
                                        {completedSessions} / {totalSessions}
                                      </p>
                                    </div>

                                    {/* Progress */}
                                    <div className="flex-shrink-0 w-32">
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full rounded-full transition-all ${
                                              isCompleted 
                                                ? 'bg-green-500' 
                                                : progress > 0 
                                                ? 'bg-primary'
                                                : 'bg-muted-foreground'
                                            }`}
                                            style={{ width: `${progress}%` }}
                                          />
                                        </div>
                                        <span className="text-sm font-semibold w-10 text-right">
                                          {progress}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CollapsibleTrigger>

                            {/* Expanded Content */}
                            <CollapsibleContent>
                              <div className="px-6 py-4 bg-muted/20">
                                 {/* Session Progress Table */}
                                {enrollment.sessions && enrollment.sessions.length > 0 && (
                                  <div className="mb-10">
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                                      <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10">
                                        <BookOpen className="h-4 w-4 text-primary" />
                                      </div>
                                      세션별 학습 진도
                                    </h4>
                                    <div className="border border-border/50 rounded-xl overflow-hidden bg-background shadow-sm">
                                      <table className="w-full text-sm">
                                        <thead className="bg-muted/70">
                                          <tr>
                                            <th className="text-left py-2.5 px-4 font-semibold text-foreground w-52">섹션</th>
                                            <th className="text-left py-2.5 px-4 font-semibold text-foreground">세션명</th>
                                            <th className="text-center py-2.5 px-4 font-semibold text-foreground w-24">영상 길이</th>
                                            <th className="text-center py-2.5 px-4 font-semibold text-foreground w-28">시청 시간</th>
                                            <th className="text-center py-2.5 px-4 font-semibold text-foreground w-20">시청율</th>
                                            <th className="text-center py-2.5 px-4 font-semibold text-foreground w-24">상태</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                          {enrollment.sessions
                                            .sort((a, b) => {
                                              const aSectionOrder = (a.session as any)?.section?.order_index || 0;
                                              const bSectionOrder = (b.session as any)?.section?.order_index || 0;
                                              if (aSectionOrder !== bSectionOrder) {
                                                return aSectionOrder - bSectionOrder;
                                              }
                                              return ((a.session as any)?.order_index || 0) - ((b.session as any)?.order_index || 0);
                                            })
                                            .map((session, idx) => {
                                              const sectionTitle = (session.session as any)?.section?.title || '-';
                                              const watchedMinutes = Math.floor(session.watched_duration_seconds / 60);
                                              const watchedSeconds = session.watched_duration_seconds % 60;
                                              
                                              const videoDuration = (session.session as any)?.video_duration_seconds || 0;
                                              const durationMinutes = Math.floor(videoDuration / 60);
                                              const durationSeconds = videoDuration % 60;
                                              
                                              const watchPercentage = videoDuration > 0 
                                                ? Math.min(Math.round((session.watched_duration_seconds / videoDuration) * 100), 100)
                                                : 0;
                                              
                                              return (
                                                <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                                                  <td className="py-2.5 px-4">
                                                    <span className="inline-flex items-center text-xs font-medium text-muted-foreground bg-muted/80 px-2.5 py-1 rounded-md border border-border/30">
                                                      {sectionTitle}
                                                    </span>
                                                  </td>
                                                  <td className="py-2.5 px-4">
                                                    <span className="font-medium text-foreground">{(session.session as any)?.title || '-'}</span>
                                                  </td>
                                                  <td className="py-2.5 px-4 text-center">
                                                    <span className="text-sm text-muted-foreground font-mono">
                                                      {videoDuration > 0 
                                                        ? `${durationMinutes > 0 ? `${durationMinutes}분 ` : ''}${durationSeconds}초`
                                                        : '-'
                                                      }
                                                    </span>
                                                  </td>
                                                  <td className="py-2.5 px-4 text-center">
                                                    <span className="text-sm text-muted-foreground font-mono">
                                                      {watchedMinutes > 0 ? `${watchedMinutes}분 ` : ''}{watchedSeconds}초
                                                    </span>
                                                  </td>
                                                  <td className="py-2.5 px-4 text-center">
                                                    <span className={`text-sm font-semibold ${
                                                      watchPercentage >= 80 
                                                        ? 'text-green-600 dark:text-green-400' 
                                                        : watchPercentage >= 50 
                                                        ? 'text-blue-600 dark:text-blue-400'
                                                        : 'text-muted-foreground'
                                                    }`}>
                                                      {videoDuration > 0 ? `${watchPercentage}%` : '-'}
                                                    </span>
                                                  </td>
                                                  <td className="py-2.5 px-4 text-center">
                                                    {session.completed ? (
                                                      <div className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-md">
                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                        <span className="text-xs font-semibold">완료</span>
                                                      </div>
                                                    ) : (
                                                      <div className="inline-flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span className="text-xs font-medium">진행중</span>
                                                      </div>
                                                    )}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}

                                {/* Download History */}
                                {enrollment.downloads && enrollment.downloads.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                                      <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10">
                                        <Download className="h-4 w-4 text-primary" />
                                      </div>
                                      자료 다운로드 이력
                                      <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-md ml-1">
                                        {enrollment.downloads.length}건
                                      </span>
                                    </h4>
                                    <div className="border border-border/50 rounded-xl overflow-hidden bg-background shadow-sm">
                                      <table className="w-full text-sm">
                                        <thead className="bg-muted/70">
                                          <tr>
                                            <th className="text-left py-2.5 px-4 font-semibold text-foreground">파일명</th>
                                            <th className="text-right py-2.5 px-4 font-semibold text-foreground w-48">다운로드 일시</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                          {enrollment.downloads.map((download) => (
                                            <tr key={download.id} className="hover:bg-muted/30 transition-colors">
                                              <td className="py-2.5 px-4">
                                                <div className="flex items-center gap-2">
                                                  <div className="flex items-center justify-center w-6 h-6 rounded-md bg-muted/80 flex-shrink-0">
                                                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                                  </div>
                                                  <span className="truncate font-medium text-foreground">{download.file_name}</span>
                                                </div>
                                              </td>
                                              <td className="py-2.5 px-4 text-right text-sm text-muted-foreground font-mono">
                                                {format(new Date(download.downloaded_at), 'yy.MM.dd HH:mm', { locale: ko })}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}

                                {/* Empty State */}
                                {(!enrollment.sessions || enrollment.sessions.length === 0) && 
                                 (!enrollment.downloads || enrollment.downloads.length === 0) && (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    상세 데이터가 없습니다
                                  </p>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
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
