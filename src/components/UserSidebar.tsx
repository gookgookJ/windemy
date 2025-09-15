import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BookOpen,
  Clock,
  Award,
  Settings,
  User,
  FileText,
  CreditCard,
  Heart,
  MessageCircle,
  HelpCircle,
  LogOut
} from 'lucide-react';

const UserSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    {
      path: '/my-page',
      label: '내 강의실',
      icon: BookOpen,
    },
    {
      path: '/purchase-history',
      label: '구매 내역',
      icon: CreditCard,
    },
    {
      path: '/favorite-courses',
      label: '관심 클래스',
      icon: Heart,
    },
    {
      path: '/review-management',
      label: '후기 관리',
      icon: FileText,
    }
  ];

  const supportItems = [
    {
      path: '/inquiry',
      label: '1:1 문의',
      icon: Clock,
    },
    {
      path: '/faq',
      label: '자주 묻는 질문',
      icon: HelpCircle,
    }
  ];

  const accountItems = [
    {
      path: '/account-settings',
      label: '계정 관리',
      icon: Settings,
    },
    {
      path: '/profile-settings',
      label: '회원정보관리',
      icon: User,
    }
  ];

  return (
    <Card className="sticky top-24">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold">{profile?.full_name || '사용자'}</h2>
          <p className="text-muted-foreground text-sm">
            {profile?.role === 'student' ? '학생' : 
             profile?.role === 'instructor' ? '강사' : 
             profile?.role === 'admin' ? '관리자' : '사용자'}
          </p>
        </div>

        <div className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className={`w-full justify-start text-left ${
                isActive(item.path) ? 'bg-primary/10 text-primary' : ''
              }`}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </Button>
          ))}
          
          <div className="pt-4 border-t">
            {supportItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className={`w-full justify-start text-left ${
                  isActive(item.path) ? 'bg-primary/10 text-primary' : ''
                }`}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            ))}
          </div>
          
          <div className="pt-4 border-t">
            {accountItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className={`w-full justify-start text-left ${
                  isActive(item.path) ? 'bg-primary/10 text-primary' : ''
                }`}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            ))}
            
            <Button
              variant="ghost"
              className="w-full justify-start text-left text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-3" />
              로그아웃
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSidebar;