import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, BookOpen, MessageSquare, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: '새 코스 생성',
      description: '새로운 강의 코스를 만들어보세요',
      icon: Plus,
      onClick: () => navigate('/course-management'),
      color: 'primary'
    },
    {
      title: '사용자 관리',
      description: '회원 정보를 확인하고 관리하세요',
      icon: Users,
      onClick: () => {}, // TODO: Navigate to user management
      color: 'secondary'
    },
    {
      title: '코스 승인',
      description: '대기 중인 코스를 검토하세요',
      icon: BookOpen,
      onClick: () => {}, // TODO: Navigate to course approval
      color: 'warning'
    },
    {
      title: '고객 지원',
      description: '문의사항을 확인하고 답변하세요',
      icon: MessageSquare,
      onClick: () => {}, // TODO: Navigate to support
      color: 'success'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          빠른 액션
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto p-4 justify-start"
              onClick={action.onClick}
            >
              <div className="flex items-start gap-3">
                <action.icon className="h-5 w-5 mt-0.5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};