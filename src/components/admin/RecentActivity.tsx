import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, BookOpen, CreditCard, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityItem {
  id: string;
  type: 'user' | 'course' | 'enrollment' | 'order';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'pending' | 'published';
}

export const RecentActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const activities: ActivityItem[] = [];

      // 최근 가입한 사용자 (3개)
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('full_name, created_at, email')
        .order('created_at', { ascending: false })
        .limit(3);

      recentUsers?.forEach(user => {
        activities.push({
          id: `user-${user.email}`,
          type: 'user',
          title: '신규 회원 가입',
          description: `${user.full_name || user.email}님이 가입했습니다`,
          timestamp: formatTimestamp(user.created_at),
          status: 'success'
        });
      });

      // 최근 등록된 강의 (2개)
      const { data: recentCourses } = await supabase
        .from('courses')
        .select('title, created_at, is_published')
        .order('created_at', { ascending: false })
        .limit(2);

      recentCourses?.forEach(course => {
        activities.push({
          id: `course-${course.title}`,
          type: 'course',
          title: course.is_published ? '강의 공개' : '새 강의 등록',
          description: `"${course.title}" 강의가 ${course.is_published ? '공개' : '등록'}되었습니다`,
          timestamp: formatTimestamp(course.created_at),
          status: course.is_published ? 'published' : 'pending'
        });
      });

      // 최근 수강 등록 (3개)
      const { data: recentEnrollments } = await supabase
        .from('enrollments')
        .select(`
          enrolled_at,
          profiles!inner(full_name, email),
          courses!inner(title)
        `)
        .order('enrolled_at', { ascending: false })
        .limit(3);

      recentEnrollments?.forEach(enrollment => {
        activities.push({
          id: `enrollment-${enrollment.enrolled_at}`,
          type: 'enrollment',
          title: '새 수강 등록',
          description: `${enrollment.profiles.full_name || enrollment.profiles.email}님이 "${enrollment.courses.title}"에 등록했습니다`,
          timestamp: formatTimestamp(enrollment.enrolled_at),
          status: 'success'
        });
      });

      // 시간순으로 정렬
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setActivities(activities.slice(0, 8));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'user':
        return User;
      case 'course':
        return BookOpen;
      case 'enrollment':
        return UserCheck;
      case 'order':
        return CreditCard;
      default:
        return Clock;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const variants = {
      success: 'default',
      pending: 'secondary',
      published: 'default',
      failed: 'destructive'
    } as const;
    
    const labels = {
      success: '완료',
      pending: '대기',
      published: '공개',
      failed: '실패'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]} className="text-xs">
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            실시간 활동
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded animate-pulse" />
                  <div className="h-2 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          실시간 활동
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">최근 활동이 없습니다</p>
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = getIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm leading-tight">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activity.description}</p>
                      </div>
                      {getStatusBadge(activity.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};