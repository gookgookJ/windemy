import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, BookOpen, CreditCard } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'user' | 'course' | 'order';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'pending' | 'failed';
}

export const RecentActivity = () => {
  // Mock data - replace with real data
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'user',
      title: '새 사용자 가입',
      description: '홍길동님이 회원가입했습니다',
      timestamp: '2분 전'
    },
    {
      id: '2',
      type: 'course',
      title: '코스 등록',
      description: 'React 완벽 가이드 코스가 등록되었습니다',
      timestamp: '15분 전'
    },
    {
      id: '3',
      type: 'order',
      title: '결제 완료',
      description: '김철수님이 JavaScript 기초 코스를 구매했습니다',
      timestamp: '1시간 전',
      status: 'success'
    },
    {
      id: '4',
      type: 'order',
      title: '결제 실패',
      description: '박영희님의 결제가 실패했습니다',
      timestamp: '2시간 전',
      status: 'failed'
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'user':
        return User;
      case 'course':
        return BookOpen;
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
      failed: 'destructive'
    } as const;
    
    const labels = {
      success: '성공',
      pending: '대기',
      failed: '실패'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          최근 활동
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getIcon(activity.type);
            return (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <Icon className="h-4 w-4 mt-1 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">{activity.title}</p>
                    {getStatusBadge(activity.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};