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
      path: 'https://windemy.channel.io/home',
      label: '1:1 문의',
      icon: Clock,
      external: true,
    }
  ];

  const accountItems = [
    {
      path: '/profile-settings',
      label: '회원정보관리',
      icon: User,
    }
  ];

  return (
    <Card className="sticky top-24">
      <CardContent className="p-4 md:p-6">
        <div className="text-center mb-4 md:mb-6">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
            <User className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <h2 className="text-lg md:text-xl font-bold">{profile?.full_name || '사용자'}</h2>
          <p className="text-muted-foreground text-xs md:text-sm">
            {profile?.role === 'student' ? '학생' : 
             profile?.role === 'instructor' ? '강사' : 
             profile?.role === 'admin' ? '관리자' : '사용자'}
          </p>
        </div>

        <div className="space-y-0.5 md:space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className={`w-full justify-start text-left h-8 md:h-10 text-xs md:text-sm ${
                isActive(item.path) ? 'bg-primary/10 text-primary' : ''
              }`}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="w-3 h-3 md:w-4 md:h-4 mr-2 md:mr-3" />
              {item.label}
            </Button>
          ))}
          
          <div className="pt-2 md:pt-4 border-t">
            {supportItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className={`w-full justify-start text-left h-8 md:h-10 text-xs md:text-sm ${
                  !item.external && isActive(item.path) ? 'bg-primary/10 text-primary' : ''
                }`}
                onClick={() => {
                  if (item.external) {
                    window.open(item.path, '_blank');
                  } else {
                    navigate(item.path);
                  }
                }}
              >
                <item.icon className="w-3 h-3 md:w-4 md:h-4 mr-2 md:mr-3" />
                {item.label}
              </Button>
            ))}
          </div>
          
          <div className="pt-2 md:pt-4 border-t">
            {accountItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className={`w-full justify-start text-left h-8 md:h-10 text-xs md:text-sm ${
                  isActive(item.path) ? 'bg-primary/10 text-primary' : ''
                }`}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="w-3 h-3 md:w-4 md:h-4 mr-2 md:mr-3" />
                {item.label}
              </Button>
            ))}
            
            <Button
              variant="ghost"
              className="w-full justify-start text-left h-8 md:h-10 text-xs md:text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="w-3 h-3 md:w-4 md:h-4 mr-2 md:mr-3" />
              로그아웃
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSidebar;