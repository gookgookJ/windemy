import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  LogOut,
  Menu
} from 'lucide-react';

const MobileUserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
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

  const handleNavigation = (path: string, external?: boolean) => {
    if (external) {
      window.open(path, '_blank');
    } else {
      navigate(path);
      setIsOpen(false);
    }
  };

  return (
    <div className="lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="fixed top-20 left-4 z-50 bg-background shadow-lg">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle className="text-left">내 계정</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6">
            {/* 사용자 프로필 */}
            <div className="text-center mb-6 p-4 bg-muted rounded-lg">
              <Avatar className="h-16 w-16 mx-auto mb-3">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {profile?.full_name ? profile.full_name[0] : 'U'}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-bold">{profile?.full_name || '사용자'}</h3>
              <p className="text-muted-foreground text-sm">
                {profile?.role === 'student' ? '학생' : 
                 profile?.role === 'instructor' ? '강사' : 
                 profile?.role === 'admin' ? '관리자' : '사용자'}
              </p>
            </div>

            {/* 메인 메뉴 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground px-2 py-1">메인 메뉴</h4>
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`w-full justify-start text-left ${
                    isActive(item.path) ? 'bg-primary/10 text-primary' : ''
                  }`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              ))}
            </div>
            
            {/* 고객지원 */}
            <div className="space-y-2 mt-6">
              <h4 className="text-sm font-medium text-muted-foreground px-2 py-1">고객지원</h4>
              {supportItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className="w-full justify-start text-left"
                  onClick={() => handleNavigation(item.path, item.external)}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              ))}
            </div>
            
            {/* 계정 관리 */}
            <div className="space-y-2 mt-6">
              <h4 className="text-sm font-medium text-muted-foreground px-2 py-1">계정 관리</h4>
              {accountItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`w-full justify-start text-left ${
                    isActive(item.path) ? 'bg-primary/10 text-primary' : ''
                  }`}
                  onClick={() => handleNavigation(item.path)}
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
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileUserMenu;