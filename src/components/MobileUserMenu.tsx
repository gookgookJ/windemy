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
    <div className="lg:hidden fixed top-4 left-4 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="bg-background/95 backdrop-blur-sm shadow-lg border-2 hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="h-full flex flex-col">
            {/* 헤더 */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-primary to-primary/80">
              <h2 className="text-lg font-bold text-white">내 계정</h2>
            </div>
            
            {/* 사용자 프로필 */}
            <div className="p-6 text-center border-b">
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

            {/* 스크롤 가능한 메뉴 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* 메인 메뉴 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground px-2 py-1">메인 메뉴</h4>
                {menuItems.map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className={`w-full justify-start text-left h-12 ${
                      isActive(item.path) ? 'bg-primary/10 text-primary border border-primary/20' : ''
                    }`}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>
                ))}
              </div>
              
              {/* 고객지원 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground px-2 py-1">고객지원</h4>
                {supportItems.map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className="w-full justify-start text-left h-12"
                    onClick={() => handleNavigation(item.path, item.external)}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>
                ))}
              </div>
              
              {/* 계정 관리 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground px-2 py-1">계정 관리</h4>
                {accountItems.map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className={`w-full justify-start text-left h-12 ${
                      isActive(item.path) ? 'bg-primary/10 text-primary border border-primary/20' : ''
                    }`}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* 하단 로그아웃 */}
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start text-left text-destructive hover:text-destructive hover:bg-destructive/10 h-12"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5 mr-3" />
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