import { useState, useEffect, useRef } from "react"; // ✨ useEffect, useRef 추가
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, User, Menu, X, BookOpen, CreditCard, Heart, FileText, Clock, LogOut, Info, GraduationCap, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import { SearchDropdown } from "@/components/SearchDropdown";
import { useIsMobile } from "@/hooks/use-mobile";

const HEADER_HEIGHT = 64; // ✨ 헤더 높이 (h-16 = 64px)
const HEADER_SCROLL_THRESHOLD = 5; // ✨ 헤더 숨김 시작점

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signup');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { user, profile, signOut, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  // ✨ --- 스크롤 감지 로직 추가 (모바일에서만 동작) ---
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      // PC/태블릿에서는 항상 헤더 표시
      if (!isMobile) {
        setIsVisible(true);
        return;
      }

      const currentScrollY = window.scrollY;
      
      if (currentScrollY <= HEADER_SCROLL_THRESHOLD) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }
      
      if (currentScrollY > lastScrollY.current) {
        setIsVisible(false); // 스크롤 내릴 때
      } else {
        setIsVisible(true); // 스크롤 올릴 때
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);
  // ✨ --- 여기까지 ---

  const navigationItems = [
    { name: "소개", href: "/about", icon: Info },
    { 
      name: "클래스", 
      href: "/courses",
      icon: GraduationCap,
      submenu: [
        { name: "무료강의", href: "/courses/free-courses" },
        { name: "VOD 강의", href: "/courses/vod-courses" },
        { name: "프리미엄 강의", href: "/courses/premium-courses" },
      ]
    },
    { name: "강사 지원", href: "/instructor-apply", icon: UserPlus },
  ];

  // MyPage menu items
  const myPageMenuItems = [
    { name: "내 강의실", href: "/my-page", icon: BookOpen },
    { name: "구매 내역", href: "/purchase-history", icon: CreditCard },
    { name: "관심 클래스", href: "/favorite-courses", icon: Heart },
    { name: "후기 관리", href: "/review-management", icon: FileText },
    { name: "1:1 문의", href: "https://windemy.channel.io/home", icon: Clock, external: true },
    { name: "회원정보관리", href: "/profile-settings", icon: User },
  ];

  // Check if current page is MyPage related
  const isMyPageRoute = location.pathname.startsWith('/my-page') || 
                       location.pathname.startsWith('/purchase-history') ||
                       location.pathname.startsWith('/favorite-courses') ||
                       location.pathname.startsWith('/review-management') ||
                       location.pathname.startsWith('/profile-settings');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    // ✨ className과 style 수정
    <header 
      className={`bg-white fixed top-0 left-0 right-0 z-50 font-sans transition-transform duration-300 ease-in-out sm:border-b sm:border-border sm:shadow-sm`}
      style={{ transform: isVisible ? 'translateY(0)' : `translateY(-${HEADER_HEIGHT}px)` }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3 flex-shrink-0 select-none">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-[18px] leading-none">W</span>
              </div>
              <span className="text-[20px] leading-none tracking-tight font-bold text-foreground whitespace-nowrap">윈들리아카데미</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-8">
              {/* ... (내부 코드는 변경 없음) ... */}
              {navigationItems.map((item) => (
                <div key={item.name} className="relative group">
                  {item.submenu ? (
                    <>
                      <button className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium flex items-center gap-1">
                        {item.name}
                        <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="py-2">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              to={subItem.href}
                              className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors duration-200"
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      to={item.href}
                      className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Search Bar - Hidden on MyPage routes, expanded width */}
          {!isMyPageRoute && (
            <div className="hidden md:flex items-center flex-1 max-w-xl mx-8">
              <SearchDropdown />
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Hide mobile search on MyPage routes */}
            {!isMyPageRoute && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              >
                <Search className="w-5 h-5" />
              </Button>
            )}
            
            {/* Mobile login button for non-logged in users */}
            {!user && (
              <Button 
                variant="default" 
                size="sm"
                className="sm:hidden text-xs px-2"
                onClick={() => {
                  setAuthModalTab('signin');
                  setIsAuthModalOpen(true);
                }}
              >
                로그인
              </Button>
            )}
            
            {user ? (
              <div className="flex items-center space-x-2">
                {/* Desktop admin button - only show on desktop */}
                {isAdmin && (
                  <Link to="/admin" className="hidden lg:block">
                    <Button variant="destructive" size="sm" className="text-xs whitespace-nowrap">
                      관리자
                    </Button>
                  </Link>
                )}
                <Link to="/my-page">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">내 강의실</span>
                  </Button>
                </Link>
                {/* 통합 햄버거 메뉴 (모바일 + 태블릿) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:block lg:hidden"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setAuthModalTab('signin');
                    setIsAuthModalOpen(true);
                  }}
                >
                  로그인
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => {
                    setAuthModalTab('signup');
                    setIsAuthModalOpen(true);
                  }}
                >
                  회원가입
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Dropdown - Hidden on MyPage routes */}
        {isMobileSearchOpen && !isMyPageRoute && (
          <div className="md:hidden border-t border-border bg-white px-4 py-4">
            <SearchDropdown onClose={() => setIsMobileSearchOpen(false)} />
          </div>
        )}

        {/* Mobile/Tablet Menu - Enhanced UI/UX */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-border bg-white/95 backdrop-blur-md w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
            <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
              
              <nav className="space-y-2">
                {isMyPageRoute ? (
                  // MyPage specific menu items with enhanced styling
                  <>
                    <div className="grid gap-3">
                    {myPageMenuItems.map((item, index) => (
                        <div key={item.name} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                          {item.external ? (
                            <button
                              className="w-full text-left flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-muted/30 to-muted/10 hover:from-primary/5 hover:to-primary/10 border border-transparent hover:border-primary/10 transition-all duration-300 font-medium text-foreground hover:text-primary"
                              onClick={() => {
                                window.open(item.href, '_blank');
                                setIsMenuOpen(false);
                              }}
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-muted/20 to-muted/40 group-hover:from-primary/10 group-hover:to-primary/20 transition-all duration-300">
                                  <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                                </div>
                                <span className="text-base font-semibold">{item.name}</span>
                              </div>
                            </button>
                        ) : (
                            <Link
                              to={item.href}
                              className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-muted/30 to-muted/10 hover:from-primary/5 hover:to-primary/10 border border-transparent hover:border-primary/10 transition-all duration-300 font-medium text-foreground hover:text-primary"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-muted/20 to-muted/40 group-hover:from-primary/10 group-hover:to-primary/20 transition-all duration-300">
                                  <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                                </div>
                                <span className="text-base font-semibold">{item.name}</span>
                              </div>
                            </Link>
                        )}
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 mt-4">
                      <div className="animate-fade-in">
                        <button
                          className="w-full text-left flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-destructive/5 to-red-50 hover:from-destructive/10 hover:to-red-100 border border-destructive/10 hover:border-destructive/20 transition-all duration-300 font-medium text-destructive hover:text-destructive"
                          onClick={handleSignOut}
                        >
                          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/20 group-hover:from-destructive/20 group-hover:to-destructive/30 transition-all duration-300">
                            <LogOut className="w-5 h-5 text-destructive" />
                          </div>
                          <span className="text-base font-semibold">로그아웃</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  // Regular navigation items with clean styling
                  <>
                    <div className="grid gap-3">
                      {navigationItems.map((item, index) => (
                        <div key={item.name} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                          <div className="group">
                            <Link
                              to={item.href}
                              className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-muted/30 to-muted/10 hover:from-primary/5 hover:to-primary/10 border border-transparent hover:border-primary/10 transition-all duration-300 font-medium text-foreground hover:text-primary"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-muted/20 to-muted/40 group-hover:from-primary/10 group-hover:to-primary/20 transition-all duration-300">
                                  {item.icon && (
                                    <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                                  )}
                                </div>
                                <div>
                                  <span className="text-base font-semibold">{item.name}</span>
                                  {item.submenu && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {item.submenu.length}개 항목
                                    </p>
                                  )}
                                </div>
                              </div>
                              {item.submenu && (
                                <div className="text-muted-foreground group-hover:text-primary transition-colors duration-300">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              )}
                            </Link>
                            {item.submenu && (
                              <div className="mt-2 ml-4 space-y-1">
                                {item.submenu.map((subItem, subIndex) => (
                                  <Link
                                    key={subItem.name}
                                    to={subItem.href}
                                    className="block text-sm text-muted-foreground hover:text-primary transition-colors duration-200 py-2 px-4 rounded-lg hover:bg-muted/30"
                                    onClick={() => setIsMenuOpen(false)}
                                    style={{ animationDelay: `${(index * 0.1) + (subIndex * 0.05)}s` }}
                                  >
                                    {subItem.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {user && isAdmin && (
                      <div className="pt-4 mt-4">
                        <div className="animate-fade-in">
                          <Link 
                            to="/admin" 
                            className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-destructive/5 to-red-50 hover:from-destructive/10 hover:to-red-100 border border-destructive/10 hover:border-destructive/20 transition-all duration-300 font-medium text-destructive hover:text-destructive"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/20 group-hover:from-destructive/20 group-hover:to-destructive/30 transition-all duration-300">
                              <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <span className="text-base font-semibold">관리자</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </nav>
              
              {!user && !isMyPageRoute && (
                <div className="pt-4">
                  <div className="animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-14 text-base font-semibold rounded-2xl border-2 hover:border-primary/50 transition-all duration-300"
                        onClick={() => {
                          setAuthModalTab('signin');
                          setIsAuthModalOpen(true);
                          setIsMenuOpen(false);
                        }}
                      >
                        로그인
                      </Button>
                      <Button 
                        variant="default" 
                        className="h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300"
                        onClick={() => {
                          setAuthModalTab('signup');
                          setIsAuthModalOpen(true);
                          setIsMenuOpen(false);
                        }}
                      >
                        회원가입
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </header>
  );
};

export default Header;