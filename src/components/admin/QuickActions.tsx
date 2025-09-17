import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, MessageSquare, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: '강의 관리',
      description: '전체 강의를 관리하고 승인하세요',
      icon: BookOpen,
      onClick: () => navigate('/admin/courses'),
      color: 'primary'
    },
    {
      title: '회원 관리',
      description: '회원 정보와 권한을 관리하세요',
      icon: Users,
      onClick: () => navigate('/admin/users'),
      color: 'secondary'
    },
    {
      title: '주문 현황',
      description: '결제 현황과 주문을 확인하세요',
      icon: MessageSquare,
      onClick: () => navigate('/admin/orders'),
      color: 'success'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          주요 관리 기능
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto p-4 justify-start hover:bg-muted/50"
              onClick={action.onClick}
            >
              <div className="flex items-start gap-3 w-full">
                <action.icon className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                <div className="text-left flex-1">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{action.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};