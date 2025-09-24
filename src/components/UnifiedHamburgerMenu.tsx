import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  BookOpen,
  Clock,
  User,
  FileText,
  CreditCard,
  Heart,
  LogOut,
  Menu,
  Search,
  Home,
  Info,
  GraduationCap,
  UserPlus,
  Settings,
  Shield
} from 'lucide-react';

const UnifiedHamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signup');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;
  const isMyPageSection = location.pathname.startsWith('/my-page') || 
                         location.pathname.startsWith('/purchase-history') ||
                         location.pathname.startsWith('/favorite-courses') ||
                         location.pathname.startsWith('/review-management') ||
                         location.pathname.startsWith('/profile-settings');

  const handleNavigation = (path: string, external?: boolean) => {
    if (external) {
      window.open(path, '_blank');
    } else {
      navigate(path);
      setIsOpen(false);
    }
  };

  // 일반 페이지 메뉴 아이템
  const generalMenuItems = [
    { path: '/', label: '홈', icon: Home },
    { path: '/about', label: '소개', icon: Info },
    { path: '/courses', label: '클래스', icon: GraduationCap },
    { path: '/instructor-apply', label: '강사 지원', icon: UserPlus },
  ];

  // 마이페이지 메뉴 아이템
  const myPageMenuItems = [
    { path: '/my-page', label: '내 강의실', icon: BookOpen },
    { path: '/purchase-history', label: '구매 내역', icon: CreditCard },
    { path: '/favorite-courses', label: '관심 클래스', icon: Heart },
    { path: '/review-management', label: '후기 관리', icon: FileText },
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
    { path: '/profile-settings', label: '회원정보관리', icon: User },
  ];

  return (
    <div className="lg:hidden fixed top-4 right-4 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="bg-background/95 backdrop-blur-sm shadow-lg border-2 hover:bg-accent h-10 w-10"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 p-0 z-[100]">
          <div className="h-full flex flex-col bg-background">
            {/* 헤더 */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-primary to-primary/80">
              <h2 className="text-lg font-bold text-white">
                {isMyPageSection ? '내 계정' : '메뉴'}
              </h2>
            </div>
            
            {/* 사용자 프로필 (로그인된 경우에만) */}
            {user && (
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
            )}

            {/* 스크롤 가능한 메뉴 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* 메인 메뉴 - 페이지별로 다른 메뉴 표시 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground px-2 py-1">
                  {isMyPageSection ? '마이페이지' : '메인 메뉴'}
                </h4>
                {(isMyPageSection ? myPageMenuItems : generalMenuItems).map((item) => (
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
              
              {/* 로그인하지 않은 경우 인증 버튼 */}
              {!user && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground px-2 py-1">계정</h4>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left h-12"
                    onClick={() => {
                      setAuthModalTab('signin');
                      setIsAuthModalOpen(true);
                      setIsOpen(false);
                    }}
                  >
                    <User className="w-5 h-5 mr-3" />
                    로그인 / 회원가입
                  </Button>
                </div>
              )}

              {/* 로그인된 경우 추가 메뉴 */}
              {user && (
                <>
                  {/* 마이페이지가 아닌 경우에만 마이페이지 링크 표시 */}
                  {!isMyPageSection && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground px-2 py-1">내 계정</h4>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left h-12"
                        onClick={() => handleNavigation('/my-page')}
                      >
                        <BookOpen className="w-5 h-5 mr-3" />
                        내 강의실
                      </Button>
                    </div>
                  )}

                  {/* 관리자 메뉴 - lg 이하에서만 보임 */}
                  {isAdmin && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground px-2 py-1">관리</h4>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left h-12"
                        onClick={() => handleNavigation('/admin')}
                      >
                        <Shield className="w-5 h-5 mr-3" />
                        관리자
                      </Button>
                    </div>
                  )}

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
                </>
              )}
            </div>
            
            {/* 하단 로그아웃 (로그인된 경우에만) */}
            {user && (
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
            )}
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </div>
  );
};

export default UnifiedHamburgerMenu;